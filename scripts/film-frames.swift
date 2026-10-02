// Writes every frame of a clip as PNG (f000.png …), max width given, for scripts/key-clips.mjs.
// swiftc -O scripts/film-frames.swift -o /tmp/film-frames && /tmp/film-frames <in.mp4> <outDir> 960
// Extract every frame of a clip as PNG (max width given), lossless, for keying offline.
import AVFoundation
import AppKit
let url = URL(fileURLWithPath: CommandLine.arguments[1])
let out = CommandLine.arguments[2]
let maxW = Double(CommandLine.arguments[3]) ?? 960
try? FileManager.default.createDirectory(atPath: out, withIntermediateDirectories: true)
let asset = AVURLAsset(url: url)
let track = asset.tracks(withMediaType: .video).first!
let fps = Double(track.nominalFrameRate)
let dur = CMTimeGetSeconds(asset.duration)
let n = Int((dur * fps).rounded())
let gen = AVAssetImageGenerator(asset: asset)
gen.appliesPreferredTrackTransform = true
gen.requestedTimeToleranceBefore = .zero
gen.requestedTimeToleranceAfter = .zero
gen.maximumSize = CGSize(width: maxW, height: maxW)
print("fps", fps, "frames", n)
for i in 0..<n {
  let time = CMTime(seconds: Double(i) / fps, preferredTimescale: 600)
  guard let cg = try? gen.copyCGImage(at: time, actualTime: nil) else { print("miss", i); continue }
  let rep = NSBitmapImageRep(cgImage: cg)
  if let d = rep.representation(using: .png, properties: [:]) {
    try? d.write(to: URL(fileURLWithPath: "\(out)/f\(String(format: "%03d", i)).png"))
  }
}
print("done")
