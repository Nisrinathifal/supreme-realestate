// Joins two clips back to back (AVFoundation), optional cross-dissolve (0 = hard cut), no audio, no metadata.
// Usage: xcrun swift scripts/film-join.swift <a.mp4> <b.mp4> <out.mov> <dissolveSeconds> [aEnd] [bStart]
import AVFoundation
import Foundation
let a = CommandLine.arguments
let A = AVURLAsset(url: URL(fileURLWithPath: a[1])), B = AVURLAsset(url: URL(fileURLWithPath: a[2]))
let out = URL(fileURLWithPath: a[3]); let dissolve = Double(a[4])!
let aTrack = A.tracks(withMediaType: .video).first!, bTrack = B.tracks(withMediaType: .video).first!
let aEnd = a.count > 5 ? CMTime(seconds: Double(a[5])!, preferredTimescale: 600) : A.duration
let bStart = a.count > 6 ? CMTime(seconds: Double(a[6])!, preferredTimescale: 600) : .zero
let comp = AVMutableComposition()
let t1 = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
let t2 = comp.addMutableTrack(withMediaType: .video, preferredTrackID: kCMPersistentTrackID_Invalid)!
try! t1.insertTimeRange(CMTimeRange(start: .zero, end: aEnd), of: aTrack, at: .zero)
let d = CMTime(seconds: dissolve, preferredTimescale: 600)
let bAt = aEnd - d
let bRange = CMTimeRange(start: bStart, end: B.duration)
try! t2.insertTimeRange(bRange, of: bTrack, at: bAt)
let size = aTrack.naturalSize
// instructions: A alone, overlap (A fades out over B), B alone
let i1 = AVMutableVideoCompositionInstruction(); i1.timeRange = CMTimeRange(start: .zero, end: bAt)
let l1 = AVMutableVideoCompositionLayerInstruction(assetTrack: t1); i1.layerInstructions = [l1]
let i2 = AVMutableVideoCompositionInstruction(); i2.timeRange = CMTimeRange(start: bAt, end: aEnd)
let l2a = AVMutableVideoCompositionLayerInstruction(assetTrack: t1); l2a.setOpacityRamp(fromStartOpacity: 1, toEndOpacity: 0, timeRange: i2.timeRange)
let l2b = AVMutableVideoCompositionLayerInstruction(assetTrack: t2); i2.layerInstructions = [l2a, l2b]
let i3 = AVMutableVideoCompositionInstruction(); i3.timeRange = CMTimeRange(start: aEnd, end: bAt + bRange.duration)
let l3 = AVMutableVideoCompositionLayerInstruction(assetTrack: t2); i3.layerInstructions = [l3]
let vc = AVMutableVideoComposition(); vc.instructions = dissolve > 0 ? [i1, i2, i3] : [i1, i3]; vc.renderSize = size
vc.frameDuration = CMTime(value: 1, timescale: 30)
try? FileManager.default.removeItem(at: out)
let session = AVAssetExportSession(asset: comp, presetName: AVAssetExportPresetHighestQuality)!
session.videoComposition = vc; session.outputURL = out; session.outputFileType = .mov; session.metadata = []
let sem = DispatchSemaphore(value: 0); session.exportAsynchronously { sem.signal() }; sem.wait()
if session.status != .completed { print("failed:", session.error?.localizedDescription ?? "?"); exit(1) }
print("joined", CMTimeGetSeconds(comp.duration), "s")
