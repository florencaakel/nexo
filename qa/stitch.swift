// Compõe capturas reais de viewport; evita repetição do cabeçalho fixo.
import Foundation
import CoreGraphics
import ImageIO
let manifestURL = URL(fileURLWithPath: CommandLine.arguments[1])
let manifest = try JSONSerialization.jsonObject(with: Data(contentsOf: manifestURL)) as! [String: Any]
let width = manifest["width"] as! Int
let height = manifest["height"] as! Int
let context = CGContext(data: nil, width: width, height: height, bitsPerComponent: 8, bytesPerRow: width * 4, space: CGColorSpaceCreateDeviceRGB(), bitmapInfo: CGImageAlphaInfo.premultipliedLast.rawValue)!
context.setFillColor(CGColor(gray: 1, alpha: 1))
context.fill(CGRect(x: 0, y: 0, width: width, height: height))
for piece in manifest["pieces"] as! [[String: Any]] {
    let source = CGImageSourceCreateWithURL(URL(fileURLWithPath: piece["path"] as! String) as CFURL, nil)!
    let image = CGImageSourceCreateImageAtIndex(source, 0, nil)!
    let offset = piece["crop"] as! Int
    let dest = piece["dest"] as! Int
    let sliceHeight = min(image.height - offset, height - dest)
    let slice = image.cropping(to: CGRect(x: 0, y: offset, width: width, height: sliceHeight))!
    context.draw(slice, in: CGRect(x: 0, y: height - dest - sliceHeight, width: width, height: sliceHeight))
}
let output = URL(fileURLWithPath: manifest["output"] as! String)
let destination = CGImageDestinationCreateWithURL(output as CFURL, "public.png" as CFString, 1, nil)!
CGImageDestinationAddImage(destination, context.makeImage()!, nil)
if !CGImageDestinationFinalize(destination) { fatalError("Não foi possível salvar a captura.") }
print(output.path)
