// Re-encodes a film with AVFoundation (AVAssetReader/Writer): H.264 at a target bitrate, no audio,
// all metadata dropped (PRD §6.2). Usage: xcrun swift scripts/film-export.swift <in> <out.mp4> <width> <kbps> [start end]
// Optional start/end (seconds) trim the film, e.g. to a span whose last frame meets its first for a seamless loop.
import AVFoundation
import Foundation
let a = CommandLine.arguments
let input = URL(fileURLWithPath: a[1]), output = URL(fileURLWithPath: a[2])
let targetW = Int(a[3])!, kbps = Int(a[4])!
let asset = AVURLAsset(url: input)
guard let track = asset.tracks(withMediaType: .video).first else { print("no video track"); exit(1) }
let natural = track.naturalSize.applying(track.preferredTransform)
let srcW = abs(natural.width), srcH = abs(natural.height)
let outW = min(targetW, Int(srcW)) / 2 * 2
let outH = Int((CGFloat(outW) * srcH / srcW).rounded()) / 2 * 2
try? FileManager.default.removeItem(at: output)
let reader = try! AVAssetReader(asset: asset)
let readerOut = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
readerOut.alwaysCopiesSampleData = false
reader.add(readerOut)
// Trim window in source seconds (frames whose presentation time falls inside it are kept)
var trim: (Double, Double)? = nil
if a.count >= 7, let s = Double(a[5]), let e = Double(a[6]) { trim = (s, e) }
let frameDuration = CMTime(value: 1, timescale: CMTimeScale(track.nominalFrameRate.rounded()))
let writer = try! AVAssetWriter(outputURL: output, fileType: .mp4)
writer.metadata = []
writer.shouldOptimizeForNetworkUse = true
let settings: [String: Any] = [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: outW, AVVideoHeightKey: outH,
  AVVideoScalingModeKey: AVVideoScalingModeResizeAspectFill,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: kbps * 1000,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    AVVideoMaxKeyFrameIntervalKey: 48,
    AVVideoAllowFrameReorderingKey: true,
  ],
]
let writerIn = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
writerIn.expectsMediaDataInRealTime = false
writerIn.transform = track.preferredTransform
writer.add(writerIn)
writer.startWriting(); reader.startReading(); writer.startSession(atSourceTime: .zero)
// A trimmed film is retimed frame by frame (k / fps from zero), so every player and tool agrees on its times
var kept = 0
func shifted(_ s: CMSampleBuffer) -> CMSampleBuffer? {
  guard let (start, end) = trim else { return s }
  let pts = CMTimeGetSeconds(CMSampleBufferGetPresentationTimeStamp(s))
  if pts < start - 0.001 || pts >= end - 0.001 { return nil }
  var timing = CMSampleTimingInfo(duration: frameDuration, presentationTimeStamp: CMTimeMultiply(frameDuration, multiplier: Int32(kept)), decodeTimeStamp: .invalid)
  kept += 1
  var out: CMSampleBuffer?
  CMSampleBufferCreateCopyWithNewTiming(allocator: nil, sampleBuffer: s, sampleTimingEntryCount: 1, sampleTimingArray: &timing, sampleBufferOut: &out)
  return out
}
let queue = DispatchQueue(label: "encode"); let sem = DispatchSemaphore(value: 0)
writerIn.requestMediaDataWhenReady(on: queue) {
  while writerIn.isReadyForMoreMediaData {
    if let s = readerOut.copyNextSampleBuffer() { if let t = shifted(s) { writerIn.append(t) } } else { writerIn.markAsFinished(); writer.finishWriting { sem.signal() }; break }
  }
}
sem.wait()
if writer.status != .completed { print("failed:", writer.error?.localizedDescription ?? "?"); exit(1) }
let bytes = (try? FileManager.default.attributesOfItem(atPath: output.path)[.size] as? Int) ?? 0
print(output.lastPathComponent, "\(outW)x\(outH)", bytes / 1024, "kB")
