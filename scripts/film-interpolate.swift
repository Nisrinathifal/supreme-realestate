// Raises a film's frame rate with motion interpolation (VideoToolbox frame-rate conversion, macOS 15.4+): new
// frames are synthesised between the existing ones from estimated motion, not duplicated. Writes H.264 without
// metadata or audio (PRD §6.2). Usage: xcrun swift scripts/film-interpolate.swift <in.mp4> <out.mp4> <fps> <kbps>
import AVFoundation
import VideoToolbox

let a = CommandLine.arguments
let input = URL(fileURLWithPath: a[1]), output = URL(fileURLWithPath: a[2])
let outFps = Double(a[3])!, kbps = Int(a[4])!

let asset = AVURLAsset(url: input)
let track = asset.tracks(withMediaType: .video).first!
let W = Int(track.naturalSize.width), H = Int(track.naturalSize.height)
let srcFps = Double(track.nominalFrameRate).rounded()
guard let config = VTFrameRateConversionConfiguration(frameWidth: W, frameHeight: H, usePrecomputedFlow: false, qualityPrioritization: .quality, revision: .revision1) else {
  print("frame-rate conversion unavailable on this machine"); exit(1)
}
let processor = VTFrameProcessor()
try! processor.startSession(configuration: config)

// Decode every source frame in the processor's pixel format
let srcAttrs = config.sourcePixelBufferAttributes as [String: Any]
let formats = srcAttrs[kCVPixelBufferPixelFormatTypeKey as String]
let format: OSType = (formats as? [NSNumber])?.first.map { OSType(truncating: $0) } ?? (formats as? NSNumber).map { OSType(truncating: $0) } ?? kCVPixelFormatType_32BGRA
let reader = try! AVAssetReader(asset: asset)
let readerOut = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: format, kCVPixelBufferIOSurfacePropertiesKey as String: [:] as [String: Any]])
reader.add(readerOut); reader.startReading()
var frames: [CVPixelBuffer] = []
while let s = readerOut.copyNextSampleBuffer(), let pb = CMSampleBufferGetImageBuffer(s) { frames.append(pb) }
let n = frames.count
print("source", n, "frames at", srcFps, "fps, format", format, "→", outFps, "fps")

// Destination pool
var pool: CVPixelBufferPool?
CVPixelBufferPoolCreate(nil, nil, config.destinationPixelBufferAttributes as CFDictionary, &pool)
func fresh() -> CVPixelBuffer { var pb: CVPixelBuffer?; CVPixelBufferPoolCreatePixelBuffer(nil, pool!, &pb); return pb! }

// Writer at the new rate
try? FileManager.default.removeItem(at: output)
let writer = try! AVAssetWriter(outputURL: output, fileType: .mp4)
writer.metadata = []; writer.shouldOptimizeForNetworkUse = true
let settings: [String: Any] = [
  AVVideoCodecKey: AVVideoCodecType.h264, AVVideoWidthKey: W, AVVideoHeightKey: H,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: kbps * 1000, AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    AVVideoExpectedSourceFrameRateKey: Int(outFps), AVVideoMaxKeyFrameIntervalKey: Int(outFps) * 2, AVVideoAllowFrameReorderingKey: true,
  ],
]
let writerIn = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
writerIn.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: writerIn, sourcePixelBufferAttributes: nil)
writer.add(writerIn); writer.startWriting(); writer.startSession(atSourceTime: .zero)
func append(_ pb: CVPixelBuffer, _ k: Int) {
  while !writerIn.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.002) }
  adaptor.append(pb, withPresentationTime: CMTime(value: CMTimeValue(k), timescale: CMTimeScale(outFps)))
}

// Output frame k sits at k / outFps; between source i and i + 1 its phase is the fraction of the way across
var k = 0
let sem = DispatchSemaphore(value: 0)
for i in 0..<(n - 1) {
  let t0 = Double(i) / srcFps, t1 = Double(i + 1) / srcFps
  var phases: [Float] = []
  var ks: [Int] = []
  while Double(k) / outFps < t1 - 1e-9 {
    let phase = (Double(k) / outFps - t0) / (t1 - t0)
    if phase < 1e-6 { append(frames[i], k) } else { phases.append(Float(phase)); ks.append(k) }
    k += 1
  }
  if phases.isEmpty { continue }
  let dests = phases.map { _ in VTFrameProcessorFrame(buffer: fresh(), presentationTimeStamp: .zero)! }
  let params = VTFrameRateConversionParameters(
    sourceFrame: VTFrameProcessorFrame(buffer: frames[i], presentationTimeStamp: CMTime(seconds: t0, preferredTimescale: 600))!,
    nextFrame: VTFrameProcessorFrame(buffer: frames[i + 1], presentationTimeStamp: CMTime(seconds: t1, preferredTimescale: 600))!,
    opticalFlow: nil, interpolationPhase: phases, submissionMode: .sequential, destinationFrames: dests)!
  var failure: Error?
  processor.process(parameters: params) { _, err in failure = err; sem.signal() }
  sem.wait()
  if let e = failure { print("frame", i, "failed:", e); exit(1) }
  for (j, d) in dests.enumerated() { append(d.buffer, ks[j]) }
  if i % 48 == 0 { print("…", i, "/", n) }
}
append(frames[n - 1], k)
writerIn.markAsFinished()
writer.finishWriting { sem.signal() }
sem.wait()
processor.endSession()
if writer.status != .completed { print("failed:", writer.error?.localizedDescription ?? "?"); exit(1) }
let bytes = (try? FileManager.default.attributesOfItem(atPath: output.path)[.size] as? Int) ?? 0
print(output.lastPathComponent, "\(W)x\(H)", k + 1, "frames", bytes / 1024, "kB")
