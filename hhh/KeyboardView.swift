//
//  KeyboardView.swift
//  hhh
//
//  Keyboard view matching web version design
//

import SwiftUI

struct KeyboardView: View {
    var body: some View {
        VStack(spacing: 8) {
            // Row 1: Numbers
            HStack(spacing: 4) {
                ForEach(["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="], id: \.self) { key in
                    WebKeyView(key: key, finger: getFingerForKey(key))
                }
            }
            
            // Row 2: QWERTY
            HStack(spacing: 4) {
                WebKeyView(key: "Tab", finger: .pinky, width: 60)
                ForEach(["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"], id: \.self) { key in
                    WebKeyView(key: key, finger: getFingerForKey(key))
                }
                WebKeyView(key: "\\", finger: .pinky, width: 60)
            }
            
            // Row 3: ASDF
            HStack(spacing: 4) {
                WebKeyView(key: "Caps", finger: .pinky, width: 70)
                ForEach(["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"], id: \.self) { key in
                    WebKeyView(key: key, finger: getFingerForKey(key))
                }
                WebKeyView(key: "Return", finger: .pinky, width: 90)
            }
            
            // Row 4: ZXCV
            HStack(spacing: 4) {
                WebKeyView(key: "Shift", finger: .pinky, width: 90)
                ForEach(["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"], id: \.self) { key in
                    WebKeyView(key: key, finger: getFingerForKey(key))
                }
                WebKeyView(key: "Shift", finger: .pinky, width: 90)
            }
            
            // Row 5: Space bar
            HStack(spacing: 4) {
                WebKeyView(key: "Ctrl", finger: .pinky, width: 60)
                WebKeyView(key: "Option", finger: .pinky, width: 60)
                WebKeyView(key: "Cmd", finger: .thumb, width: 60)
                WebKeyView(key: "Space", finger: .thumb, width: 300)
                WebKeyView(key: "Cmd", finger: .thumb, width: 60)
                WebKeyView(key: "Option", finger: .pinky, width: 60)
            }
        }
    }
    
    enum Finger {
        case pinky
        case ring
        case middle
        case index
        case thumb
    }
    
    func getFingerForKey(_ key: String) -> Finger {
        let lowerKey = key.lowercased()
        
        if ["`", "1", "q", "a", "z", "tab", "caps", "shift", "ctrl", "option"].contains(lowerKey) {
            return .pinky
        }
        if ["2", "w", "s", "x"].contains(lowerKey) {
            return .ring
        }
        if ["3", "e", "d", "c"].contains(lowerKey) {
            return .middle
        }
        if ["4", "5", "r", "t", "f", "g", "v", "b", "6", "7", "y", "u", "h", "j", "n", "m"].contains(lowerKey) {
            return .index
        }
        if ["8", "i", "k", ","].contains(lowerKey) {
            return .middle
        }
        if ["9", "o", "l", "."].contains(lowerKey) {
            return .ring
        }
        if ["0", "-", "=", "p", "[", "]", ";", "'", "/", "\\", "return"].contains(lowerKey) {
            return .pinky
        }
        if ["space", "cmd"].contains(lowerKey) {
            return .thumb
        }
        return .pinky
    }
}

struct WebKeyView: View {
    let key: String
    let finger: KeyboardView.Finger
    var width: CGFloat = 40
    
    var fingerColor: Color {
        switch finger {
        case .pinky: return .pink
        case .ring: return .orange
        case .middle: return .yellow
        case .index: return .green
        case .thumb: return .blue
        }
    }
    
    var body: some View {
        Text(key)
            .font(.system(size: 11, weight: .semibold))
            .foregroundColor(.white)
            .frame(width: width, height: 40)
            .background(
                RoundedRectangle(cornerRadius: 6)
                    .fill(fingerColor.opacity(0.3))
                    .overlay(
                        RoundedRectangle(cornerRadius: 6)
                            .stroke(fingerColor, lineWidth: 1)
                    )
            )
    }
}

// Color extension for hex colors
extension Color {
    init(hex: UInt, alpha: Double = 1) {
        self.init(
            .sRGB,
            red: Double((hex >> 16) & 0xFF) / 255,
            green: Double((hex >> 08) & 0xFF) / 255,
            blue: Double((hex >> 00) & 0xFF) / 255,
            opacity: alpha
        )
    }
}

#Preview {
    KeyboardView()
        .padding()
        .background(Color(hex: 0x2c3e50))
}
