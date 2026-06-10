import AppKit
import CoreGraphics
import Foundation
import ImageIO
import UniformTypeIdentifiers

struct CropRect {
    let x: Int
    let y: Int
    let w: Int
    let h: Int
}

struct Bitmap {
    var width: Int
    var height: Int
    var data: [UInt8]
}

let root = URL(fileURLWithPath: FileManager.default.currentDirectoryPath)
let colorSpace = CGColorSpaceCreateDeviceRGB()
let bitmapInfo = CGImageAlphaInfo.premultipliedLast.rawValue | CGBitmapInfo.byteOrder32Big.rawValue

let structureAtlas: [(String, CropRect)] = [
    ("SOIL_TOP", CropRect(x: 44, y: 116, w: 132, h: 112)),
    ("GRASS_TOP", CropRect(x: 169, y: 106, w: 120, h: 126)),
    ("RUIN_ARCH", CropRect(x: 294, y: 22, w: 194, h: 216)),
    ("RUIN_WALL", CropRect(x: 490, y: 91, w: 266, h: 145)),
    ("JUNGLE", CropRect(x: 774, y: 91, w: 166, h: 139)),
    ("FENCE", CropRect(x: 47, y: 268, w: 229, h: 116)),
    ("STONE_WALL", CropRect(x: 294, y: 276, w: 235, h: 112)),
    ("STONE_WALL_GRASS", CropRect(x: 588, y: 278, w: 170, h: 106)),
    ("CHEST", CropRect(x: 774, y: 286, w: 194, h: 119)),
    ("SOIL_BIG", CropRect(x: 42, y: 408, w: 242, h: 206)),
    ("PIT", CropRect(x: 311, y: 407, w: 402, h: 222)),
    ("BUSH", CropRect(x: 798, y: 487, w: 168, h: 104)),
    ("SOIL_LONG", CropRect(x: 42, y: 662, w: 240, h: 120)),
    ("STONE_FLOOR", CropRect(x: 300, y: 671, w: 145, h: 109)),
    ("GRASS_TILE", CropRect(x: 492, y: 681, w: 145, h: 104)),
    ("BURIED", CropRect(x: 642, y: 686, w: 144, h: 94)),
    ("GRASS_PATCH", CropRect(x: 798, y: 657, w: 164, h: 121)),
    ("SOIL_SMALL", CropRect(x: 48, y: 811, w: 122, h: 95)),
    ("SOIL_DARK", CropRect(x: 260, y: 815, w: 100, h: 92)),
    ("RUBBLE", CropRect(x: 429, y: 803, w: 274, h: 121)),
    ("POTS", CropRect(x: 774, y: 803, w: 191, h: 134)),
]

let toolAtlas = [
    CropRect(x: 44, y: 44, w: 88, h: 178),
    CropRect(x: 139, y: 86, w: 114, h: 137),
    CropRect(x: 291, y: 95, w: 97, h: 128),
    CropRect(x: 411, y: 59, w: 92, h: 180),
    CropRect(x: 48, y: 263, w: 92, h: 111),
    CropRect(x: 171, y: 245, w: 86, h: 142),
    CropRect(x: 288, y: 270, w: 101, h: 103),
    CropRect(x: 421, y: 267, w: 99, h: 127),
]

let groundNames: Set<String> = [
    "SOIL_TOP", "GRASS_TOP", "SOIL_BIG", "SOIL_LONG", "STONE_FLOOR",
    "GRASS_TILE", "GRASS_PATCH", "SOIL_SMALL", "SOIL_DARK", "STONE_WALL", "STONE_WALL_GRASS",
]

let cutoutNames: Set<String> = [
    "RUIN_ARCH", "RUIN_WALL", "JUNGLE", "FENCE", "STONE_WALL", "STONE_WALL_GRASS",
    "CHEST", "BUSH", "BURIED", "GRASS_PATCH", "RUBBLE", "POTS", "PIT",
]

let groundTints: [String: (UInt8, UInt8, UInt8)] = [
    "SOIL_TOP": (139, 94, 26), "SOIL_BIG": (139, 94, 26), "SOIL_LONG": (139, 94, 26),
    "SOIL_SMALL": (139, 94, 26), "SOIL_DARK": (139, 94, 26),
    "GRASS_TOP": (61, 122, 40), "GRASS_TILE": (61, 122, 40), "GRASS_PATCH": (61, 122, 40),
    "STONE_FLOOR": (106, 106, 90), "STONE_WALL": (106, 106, 90), "STONE_WALL_GRASS": (90, 80, 64),
]

func loadImage(_ relativePath: String) throws -> CGImage {
    let url = root.appendingPathComponent(relativePath)
    guard let source = CGImageSourceCreateWithURL(url as CFURL, nil),
          let image = CGImageSourceCreateImageAtIndex(source, 0, nil) else {
        throw NSError(domain: "asset-export", code: 1, userInfo: [NSLocalizedDescriptionKey: "Could not load \(relativePath)"])
    }
    return image
}

func drawImage(_ image: CGImage, width: Int, height: Int, draw: (CGContext) -> Void) -> Bitmap {
    var bitmap = Bitmap(width: width, height: height, data: Array(repeating: 0, count: width * height * 4))
    bitmap.data.withUnsafeMutableBytes { bytes in
        let context = CGContext(
            data: bytes.baseAddress,
            width: width,
            height: height,
            bitsPerComponent: 8,
            bytesPerRow: width * 4,
            space: colorSpace,
            bitmapInfo: bitmapInfo
        )!
        context.interpolationQuality = .none
        context.clear(CGRect(x: 0, y: 0, width: width, height: height))
        draw(context)
    }
    return bitmap
}

func crop(_ image: CGImage, _ rect: CropRect) -> Bitmap {
    let cropRect = CGRect(x: rect.x, y: rect.y, width: rect.w, height: rect.h)
    let cropped = image.cropping(to: cropRect) ?? image
    return drawImage(cropped, width: rect.w, height: rect.h) { context in
        context.draw(cropped, in: CGRect(x: 0, y: 0, width: rect.w, height: rect.h))
    }
}

func makeCGImage(_ bitmap: Bitmap) -> CGImage {
    let data = Data(bitmap.data)
    let provider = CGDataProvider(data: data as CFData)!
    return CGImage(
        width: bitmap.width,
        height: bitmap.height,
        bitsPerComponent: 8,
        bitsPerPixel: 32,
        bytesPerRow: bitmap.width * 4,
        space: colorSpace,
        bitmapInfo: CGBitmapInfo(rawValue: bitmapInfo),
        provider: provider,
        decode: nil,
        shouldInterpolate: false,
        intent: .defaultIntent
    )!
}

func savePNG(_ bitmap: Bitmap, _ relativePath: String) throws {
    let url = root.appendingPathComponent(relativePath)
    try FileManager.default.createDirectory(at: url.deletingLastPathComponent(), withIntermediateDirectories: true)
    guard let destination = CGImageDestinationCreateWithURL(url as CFURL, UTType.png.identifier as CFString, 1, nil) else {
        throw NSError(domain: "asset-export", code: 2, userInfo: [NSLocalizedDescriptionKey: "Could not create \(relativePath)"])
    }
    CGImageDestinationAddImage(destination, makeCGImage(bitmap), nil)
    if !CGImageDestinationFinalize(destination) {
        throw NSError(domain: "asset-export", code: 3, userInfo: [NSLocalizedDescriptionKey: "Could not save \(relativePath)"])
    }
}

func lowerFileName(_ name: String) -> String {
    return name.lowercased() + ".png"
}

func setAlpha(_ bitmap: inout Bitmap, at index: Int, to newAlpha: UInt8) {
    let oldAlpha = bitmap.data[index + 3]
    if newAlpha == 0 || oldAlpha == 0 {
        bitmap.data[index] = 0
        bitmap.data[index + 1] = 0
        bitmap.data[index + 2] = 0
        bitmap.data[index + 3] = 0
        return
    }
    let ratio = Double(newAlpha) / Double(oldAlpha)
    bitmap.data[index] = UInt8(min(255, Double(bitmap.data[index]) * ratio))
    bitmap.data[index + 1] = UInt8(min(255, Double(bitmap.data[index + 1]) * ratio))
    bitmap.data[index + 2] = UInt8(min(255, Double(bitmap.data[index + 2]) * ratio))
    bitmap.data[index + 3] = newAlpha
}

func removeBlackBackdrop(_ bitmap: inout Bitmap) {
    for i in stride(from: 0, to: bitmap.data.count, by: 4) {
        let r = bitmap.data[i]
        let g = bitmap.data[i + 1]
        let b = bitmap.data[i + 2]
        let a = bitmap.data[i + 3]
        if a < 12 || (r < 20 && g < 20 && b < 20) {
            setAlpha(&bitmap, at: i, to: 0)
        }
    }
}

func removeEdgeBackdrop(_ bitmap: inout Bitmap) {
    let width = bitmap.width
    let height = bitmap.height
    let step = max(2, min(width, height) / 18)
    var samples: [(Double, Double, Double)] = []

    func addSample(_ x: Int, _ y: Int) {
        let i = (y * width + x) * 4
        if bitmap.data[i + 3] > 16 {
            samples.append((Double(bitmap.data[i]), Double(bitmap.data[i + 1]), Double(bitmap.data[i + 2])))
        }
    }

    var x = 0
    while x < width {
        addSample(x, 0)
        addSample(x, height - 1)
        x += step
    }
    var y = 0
    while y < height {
        addSample(0, y)
        addSample(width - 1, y)
        y += step
    }

    for py in 0..<height {
        for px in 0..<width {
            let i = (py * width + px) * 4
            if bitmap.data[i + 3] < 16 {
                setAlpha(&bitmap, at: i, to: 0)
                continue
            }
            var minDist = Double.greatestFiniteMagnitude
            let r = Double(bitmap.data[i])
            let g = Double(bitmap.data[i + 1])
            let b = Double(bitmap.data[i + 2])
            for sample in samples {
                let dr = r - sample.0
                let dg = g - sample.1
                let db = b - sample.2
                minDist = min(minDist, dr * dr + dg * dg + db * db)
            }
            let edgeDist = sqrt(minDist)
            if edgeDist < 26 {
                setAlpha(&bitmap, at: i, to: 0)
            } else if edgeDist < 52 {
                let alpha = UInt8(max(0, min(255, (edgeDist - 26) / 26 * Double(bitmap.data[i + 3]))))
                setAlpha(&bitmap, at: i, to: alpha)
            }
        }
    }
}

func trim(_ bitmap: Bitmap, pad: Int = 2) -> Bitmap {
    var minX = bitmap.width
    var minY = bitmap.height
    var maxX = -1
    var maxY = -1
    for y in 0..<bitmap.height {
        for x in 0..<bitmap.width {
            let a = bitmap.data[(y * bitmap.width + x) * 4 + 3]
            if a > 18 {
                minX = min(minX, x)
                minY = min(minY, y)
                maxX = max(maxX, x)
                maxY = max(maxY, y)
            }
        }
    }
    if maxX < minX || maxY < minY {
        return bitmap
    }
    minX = max(0, minX - pad)
    minY = max(0, minY - pad)
    maxX = min(bitmap.width - 1, maxX + pad)
    maxY = min(bitmap.height - 1, maxY + pad)

    let newWidth = maxX - minX + 1
    let newHeight = maxY - minY + 1
    var out = Bitmap(width: newWidth, height: newHeight, data: Array(repeating: 0, count: newWidth * newHeight * 4))
    for y in 0..<newHeight {
        for x in 0..<newWidth {
            let src = ((y + minY) * bitmap.width + (x + minX)) * 4
            let dst = (y * newWidth + x) * 4
            out.data[dst] = bitmap.data[src]
            out.data[dst + 1] = bitmap.data[src + 1]
            out.data[dst + 2] = bitmap.data[src + 2]
            out.data[dst + 3] = bitmap.data[src + 3]
        }
    }
    return out
}

func makeTile(_ bitmap: Bitmap, tint: (UInt8, UInt8, UInt8)) -> Bitmap {
    var out = Bitmap(width: 48, height: 48, data: Array(repeating: 0, count: 48 * 48 * 4))
    let marginX = min(bitmap.width / 4, 36)
    let marginY = min(bitmap.height / 4, 36)
    let sampleWidth = max(1, bitmap.width - marginX * 2)
    let sampleHeight = max(1, bitmap.height - marginY * 2)
    for y in 0..<48 {
        for x in 0..<48 {
            let dst = (y * 48 + x) * 4
            let sx = min(bitmap.width - 1, max(0, marginX + x * sampleWidth / 48))
            let sy = min(bitmap.height - 1, max(0, marginY + y * sampleHeight / 48))
            let src = (sy * bitmap.width + sx) * 4
            let edge = min(min(x, 47 - x), min(y, 47 - y))
            let edgeBlend = edge < 2 ? 0.20 : 0.0
            let light = 1.0 + 0.10 * (1.0 - hypot(Double(x - 18), Double(y - 12)) / 45.0)
            out.data[dst] = UInt8(min(255, max(0, Double(bitmap.data[src]) * (0.88 - edgeBlend) + Double(tint.0) * (0.12 + edgeBlend)) * light))
            out.data[dst + 1] = UInt8(min(255, max(0, Double(bitmap.data[src + 1]) * (0.88 - edgeBlend) + Double(tint.1) * (0.12 + edgeBlend)) * light))
            out.data[dst + 2] = UInt8(min(255, max(0, Double(bitmap.data[src + 2]) * (0.88 - edgeBlend) + Double(tint.2) * (0.12 + edgeBlend)) * light))
            out.data[dst + 3] = 255
        }
    }
    return out
}

let structure = try loadImage("img/Structure.png")
for (name, rect) in structureAtlas {
    var bitmap = crop(structure, rect)
    if groundNames.contains(name) {
        bitmap = makeTile(bitmap, tint: groundTints[name] ?? (139, 94, 26))
    } else if cutoutNames.contains(name) {
        removeEdgeBackdrop(&bitmap)
        bitmap = trim(bitmap)
    }
    try savePNG(bitmap, "img/cut/structure/\(lowerFileName(name))")
}

let tools = try loadImage("img/Tools.png")
for (index, rect) in toolAtlas.enumerated() {
    var bitmap = crop(tools, rect)
    removeBlackBackdrop(&bitmap)
    bitmap = trim(bitmap)
    try savePNG(bitmap, "img/cut/tools/tool_\(index).png")
}

for character in ["boy", "girl"] {
    let image = try loadImage("img/\(character.capitalized).png")
    let frameWidth = image.width / 4
    let frameHeight = image.height / 3
    for row in 0..<3 {
        for col in 0..<4 {
            let bitmap = trim(crop(image, CropRect(x: col * frameWidth, y: row * frameHeight, w: frameWidth, h: frameHeight)))
            try savePNG(bitmap, "img/cut/\(character)/r\(row)_\(col).png")
        }
    }
}

let oldMan = try loadImage("img/OldMan.png")
let oldFrameWidth = oldMan.width / 2
let oldFrameHeight = oldMan.height / 2
for col in 0..<2 {
    let bitmap = trim(crop(oldMan, CropRect(x: col * oldFrameWidth, y: 0, w: oldFrameWidth, h: oldFrameHeight)))
    try savePNG(bitmap, "img/cut/oldman/\(col).png")
}

print("Exported static cut PNG assets to img/cut")
