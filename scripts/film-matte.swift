// Follows a rigid subject crossing a fixed-camera film (the hero boat) so copy can sit behind it. The subject's
// outline is traced once by hand (POLY, film pixels at REF seconds); every frame is then matched against that
// template's colours (sum of absolute differences) to find its horizontal (and slight vertical) offset. A frame
// whose best match is no closer than the empty canal at that spot has no subject (null).
// Writes { fps, poly, frames: [[dx, dy] | null] }.
// swiftc -O scripts/film-matte.swift -o /tmp/film-matte && /tmp/film-matte <film.mp4> <out.json>
import AVFoundation
import Foundation

let REF_FRAME = 47 // the frame POLY was traced on
let POLY: [(Int, Int)] = [
  (700, 897), (693, 888), (691, 872), (700, 870), (705, 888), (712, 893), (740, 890), (743, 866), (750, 861),
  (812, 859), (828, 855), (856, 855), (882, 861), (896, 870), (909, 884), (916, 889), (939, 892), (938, 896),
  (930, 902), (922, 911), (916, 917), (882, 919), (815, 919), (747, 917), (711, 911), (700, 899),
]

let a = CommandLine.arguments
let asset = AVURLAsset(url: URL(fileURLWithPath: a[1]))
let track = asset.tracks(withMediaType: .video).first!
let fps = Double(track.nominalFrameRate)
let W = Int(track.naturalSize.width)
let laneTop = 820, laneBottom = 940, rows = laneBottom - laneTop

let reader = try! AVAssetReader(asset: asset)
let out = AVAssetReaderTrackOutput(track: track, outputSettings: [kCVPixelBufferPixelFormatTypeKey as String: kCVPixelFormatType_32BGRA])
reader.add(out); reader.startReading()
var frames: [[UInt8]] = []
while let s = out.copyNextSampleBuffer(), let pb = CMSampleBufferGetImageBuffer(s) {
  CVPixelBufferLockBaseAddress(pb, .readOnly)
  let base = CVPixelBufferGetBaseAddress(pb)!.assumingMemoryBound(to: UInt8.self)
  let bpr = CVPixelBufferGetBytesPerRow(pb)
  var f = [UInt8](repeating: 0, count: W * rows * 3)
  for y in 0..<rows { for x in 0..<W {
    let p = (laneTop + y) * bpr + x * 4, q = (y * W + x) * 3
    f[q] = base[p + 2]; f[q + 1] = base[p + 1]; f[q + 2] = base[p]
  } }
  CVPixelBufferUnlockBaseAddress(pb, .readOnly)
  frames.append(f)
}
let n = frames.count
var med = [UInt8](repeating: 0, count: W * rows * 3)
var col = [UInt8](repeating: 0, count: n)
for i in 0..<(W * rows * 3) { for k in 0..<n { col[k] = frames[k][i] }; col.sort(); med[i] = col[n / 2] }

// Template: pixels inside the polygon (shrunk by sampling every 2 px), with their colours at REF
func inside(_ x: Double, _ y: Double) -> Bool {
  var c = false
  var j = POLY.count - 1
  for i in 0..<POLY.count {
    let (xi, yi) = (Double(POLY[i].0), Double(POLY[i].1)), (xj, yj) = (Double(POLY[j].0), Double(POLY[j].1))
    if (yi > y) != (yj > y), x < (xj - xi) * (y - yi) / (yj - yi) + xi { c.toggle() }
    j = i
  }
  return c
}
let refIdx = REF_FRAME
var tpl: [(x: Int, y: Int, r: Int, g: Int, b: Int)] = []
for y in stride(from: laneTop, to: laneBottom, by: 2) { for x in stride(from: 680, to: 950, by: 2) where inside(Double(x) + 0.5, Double(y) + 0.5) {
  let q = ((y - laneTop) * W + x) * 3, f = frames[refIdx]
  tpl.append((x, y, Int(f[q]), Int(f[q + 1]), Int(f[q + 2])))
} }
func cost(_ f: [UInt8], _ dx: Int, _ dy: Int) -> (Double, Double)? {
  var s = 0, m = 0, k = 0
  for p in tpl {
    let x = p.x + dx, y = p.y + dy - laneTop
    if x < 0 || x >= W || y < 0 || y >= rows { continue }
    let q = (y * W + x) * 3
    s += abs(Int(f[q]) - p.r) + abs(Int(f[q + 1]) - p.g) + abs(Int(f[q + 2]) - p.b)
    m += abs(Int(med[q]) - p.r) + abs(Int(med[q + 1]) - p.g) + abs(Int(med[q + 2]) - p.b)
    k += 1
  }
  if k < tpl.count / 4 { return nil }
  return (Double(s) / Double(k), Double(m) / Double(k))
}

var found: [(Int, Int)?] = []
var prev: Int? = nil
for (i, f) in frames.enumerated() {
  // coarse search over the whole lane (or near the previous frame), then refine with dy
  let range = prev.map { ($0 - 24)...($0 + 24) } ?? (-1000)...(1200)
  var best: (Double, Int, Int, Double) = (.infinity, 0, 0, 0)
  for dx in stride(from: range.lowerBound, through: range.upperBound, by: prev == nil ? 4 : 1) {
    if let (c, m) = cost(f, dx, 0), c < best.0 { best = (c, dx, 0, m) }
  }
  for dx in (best.1 - 4)...(best.1 + 4) { for dy in -10...10 {
    if let (c, m) = cost(f, dx, dy), c < best.0 { best = (c, dx, dy, m) }
  } }
  let present = best.0 < 0.75 * best.3
  prev = present ? best.1 : nil
  found.append(present ? (best.1, best.2) : nil)
  if i % 12 == 0 { print(String(format: "%3d %.2fs dx=%5d dy=%2d cost=%5.1f empty=%5.1f %@", i, Double(i) / fps, best.1, best.2, best.0, best.3, present ? "boat" : "-")) }
}
// Where the subject is half out of frame the match fails: carry it on at its speed until it has left the frame
// (forwards after a run, backwards before one)
let minX = POLY.map { $0.0 }.min()!, maxX = POLY.map { $0.0 }.max()!
// Per-frame step in the direction of travel `dir` (+1 forwards, -1 backwards), from up to six matched frames
func speed(_ i: Int, _ dir: Int) -> Double? {
  var xs: [Int] = []
  var j = i
  while xs.count < 6, j >= 0, j < n, let f = found[j] { xs.append(f.0); j -= dir }
  return xs.count >= 3 ? Double(xs.first! - xs.last!) / Double(xs.count - 1) : nil
}
var filled = found
for i in 0..<n where found[i] != nil {
  for dir in [1, -1] {
    let j = i + dir
    guard j >= 0, j < n, found[j] == nil, let v = speed(i, dir) else { continue }
    var k = j, x = Double(found[i]!.0)
    while k >= 0, k < n, found[k] == nil {
      x += v
      if Int(x) + minX > W || Int(x) + maxX < 0 { break }
      filled[k] = (Int(x.rounded()), found[i]!.1)
      k += dir
    }
  }
}
let res = filled.map { $0.map { "[\($0.0),\($0.1)]" } ?? "null" }
let poly = POLY.map { "[\($0.0),\($0.1)]" }.joined(separator: ",")
let body = "{\"fps\":\(fps),\"poly\":[\(poly)],\"frames\":[" + res.joined(separator: ",") + "]}\n"
try! body.write(toFile: a[2], atomically: true, encoding: .utf8)
print("wrote", a[2], body.count, "bytes")
