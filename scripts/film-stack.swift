// Stacks keyed RGBA frames (fNNN.png, straight alpha, from scripts/key-clips.mjs) into one H.264 clip:
// the colour on top, the matte (alpha as grey) underneath a short black gap. The page draws the top half
// on a canvas and keeps only the matte's luminance (destination-in), which gives alpha video in every browser.
// No audio, no metadata (PRD §6.2).
// Usage: swiftc -O scripts/film-stack.swift -o /tmp/film-stack && /tmp/film-stack <framesDir> <out.mp4> <width> <kbps> [fps]
import AVFoundation
import Foundation
import ImageIO

let a = CommandLine.arguments
let dir = a[1], output = URL(fileURLWithPath: a[2])
let targetW = Int(a[3])!, kbps = Int(a[4])!
let fps = a.count > 5 ? Int(a[5])! : 24
let gap = 8

let files = try! FileManager.default.contentsOfDirectory(atPath: dir).filter { $0.hasSuffix(".png") }.sorted()
guard !files.isEmpty else { print("no frames"); exit(1) }

func load(_ path: String) -> (Int, Int, [UInt8]) {
  let src = CGImageSourceCreateWithURL(URL(fileURLWithPath: path) as CFURL, nil)!
  let img = CGImageSourceCreateImageAtIndex(src, 0, nil)!
  let w = img.width, h = img.height
  // straight RGBA, 8 bit per channel, drawn without premultiplication loss: read the decoded bytes directly
  let data = img.dataProvider!.data! as Data
  let bpr = img.bytesPerRow, bpp = img.bitsPerPixel / 8
  var out = [UInt8](repeating: 0, count: w * h * 4)
  data.withUnsafeBytes { (p: UnsafeRawBufferPointer) in
    for y in 0..<h { for x in 0..<w {
      let s = y * bpr + x * bpp, d = (y * w + x) * 4
      out[d] = p[s]; out[d + 1] = p[s + 1]; out[d + 2] = p[s + 2]; out[d + 3] = bpp == 4 ? p[s + 3] : 255
    } }
  }
  return (w, h, out)
}

let (srcW, srcH, _) = load("\(dir)/\(files[0])")
let stackH = srcH * 2 + gap
let outW = min(targetW, srcW) / 2 * 2
let outH = Int((CGFloat(outW) * CGFloat(stackH) / CGFloat(srcW)).rounded()) / 2 * 2

try? FileManager.default.removeItem(at: output)
let writer = try! AVAssetWriter(outputURL: output, fileType: .mp4)
writer.metadata = []
writer.shouldOptimizeForNetworkUse = true
let settings: [String: Any] = [
  AVVideoCodecKey: AVVideoCodecType.h264,
  AVVideoWidthKey: outW, AVVideoHeightKey: outH,
  AVVideoScalingModeKey: AVVideoScalingModeResizeAspect,
  AVVideoCompressionPropertiesKey: [
    AVVideoAverageBitRateKey: kbps * 1000,
    AVVideoProfileLevelKey: AVVideoProfileLevelH264HighAutoLevel,
    AVVideoMaxKeyFrameIntervalKey: 48,
    AVVideoAllowFrameReorderingKey: true,
  ],
]
let writerIn = AVAssetWriterInput(mediaType: .video, outputSettings: settings)
writerIn.expectsMediaDataInRealTime = false
let adaptor = AVAssetWriterInputPixelBufferAdaptor(assetWriterInput: writerIn, sourcePixelBufferAttributes: [
  kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA,
  kCVPixelBufferWidthKey as String: srcW, kCVPixelBufferHeightKey as String: stackH,
])
writer.add(writerIn)
writer.startWriting(); writer.startSession(atSourceTime: .zero)

for (i, f) in files.enumerated() {
  let (w, h, px) = load("\(dir)/\(f)")
  precondition(w == srcW && h == srcH, "frame size differs: \(f)")
  var pb: CVPixelBuffer?
  CVPixelBufferPoolCreatePixelBuffer(nil, adaptor.pixelBufferPool!, &pb)
  guard let buf = pb else { print("no buffer"); exit(1) }
  CVPixelBufferLockBaseAddress(buf, [])
  let base = CVPixelBufferGetBaseAddress(buf)!.assumingMemoryBound(to: UInt8.self)
  let bpr = CVPixelBufferGetBytesPerRow(buf)
  for y in 0..<stackH { for x in 0..<w {
    let d = y * bpr + x * 4
    if y < h { // colour
      let s = (y * w + x) * 4
      base[d] = px[s + 2]; base[d + 1] = px[s + 1]; base[d + 2] = px[s]; base[d + 3] = 255
    } else if y < h + gap { // gap
      base[d] = 0; base[d + 1] = 0; base[d + 2] = 0; base[d + 3] = 255
    } else { // matte
      let s = ((y - h - gap) * w + x) * 4 + 3
      base[d] = px[s]; base[d + 1] = px[s]; base[d + 2] = px[s]; base[d + 3] = 255
    }
  } }
  CVPixelBufferUnlockBaseAddress(buf, [])
  while !writerIn.isReadyForMoreMediaData { Thread.sleep(forTimeInterval: 0.005) }
  adaptor.append(buf, withPresentationTime: CMTime(value: CMTimeValue(i), timescale: CMTimeScale(fps)))
}
writerIn.markAsFinished()
let sem = DispatchSemaphore(value: 0)
writer.finishWriting { sem.signal() }
sem.wait()
if writer.status != .completed { print("failed:", writer.error?.localizedDescription ?? "?"); exit(1) }
let bytes = (try? FileManager.default.attributesOfItem(atPath: output.path)[.size] as? Int) ?? 0
print(output.lastPathComponent, "\(outW)x\(outH)", "frames", files.count, "gap", gap, bytes / 1024, "kB")
