//
//  ContentView.swift
//  hhh
//
//  Beautiful typing practice with day/night themes and auto-start
//

import SwiftUI

struct ContentView: View {
    @EnvironmentObject var model: TypingPracticeModel
    @FocusState private var isTextFieldFocused: Bool
    @State private var isNightMode = true
    @State private var timer: Timer?
    @State private var timeUpdate: Int = 0
    
    var body: some View {
        GeometryReader { geometry in
            ZStack {
                // Beautiful gradient background based on day/night mode
                backgroundGradient
                    .ignoresSafeArea()
                
                VStack(spacing: 0) {
                    // Top header
                    headerView
                    
                    // Statistics row
                    statisticsRow
                        .padding(.horizontal, 20)
                        .padding(.vertical, 15)
                    
                    // Typing text area - centered
                    typingTextArea
                        .frame(height: geometry.size.height * 0.4)
                        .padding(.horizontal, 20)
                    
                    Spacer()
                    
                    // Virtual keyboard
                    virtualKeyboard
                        .padding(.horizontal, 20)
                        .padding(.bottom, 20)
                }
            }
        }
        .overlay(
            // Hidden input field
            TextField("", text: Binding(
                get: { model.userInput },
                set: { newValue in
                    if newValue.count > model.userInput.count {
                        let newChar = String(newValue.suffix(1))
                        
                        // Auto-start on first keypress
                        if !model.isActive && !model.currentText.isEmpty {
                            model.startPractice()
                            startTimer()
                        }
                        
                        model.handleInput(newChar)
                    } else if newValue.count < model.userInput.count {
                        model.userInput = newValue
                    }
                }
            ))
            .focused($isTextFieldFocused)
            .opacity(0)
            .frame(width: 0, height: 0)
            .onKeyPress { keyPress in
                if keyPress.key == .return || keyPress.key == .escape {
                    model.resetPractice()
                    timer?.invalidate()
                    return .handled
                }
                return .ignored
            }
        )
        .onAppear {
            model.currentText = model.currentPracticeText
            isTextFieldFocused = true
        }
        .onDisappear {
            timer?.invalidate()
        }
        .onChange(of: model.isActive) { _, isActive in
            if !isActive {
                timer?.invalidate()
            }
        }
    }
    
    private var backgroundGradient: some View {
        Group {
            if isNightMode {
                // Night theme - beautiful purple/blue gradient
                ZStack {
                    LinearGradient(
                        colors: [
                            Color(hex: 0x1a0d2e),
                            Color(hex: 0x2d1b4e),
                            Color(hex: 0x1a0d2e)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    
                    // Subtle pattern overlay
                    LinearGradient(
                        colors: [
                            Color(hex: 0x4a2c7a).opacity(0.3),
                            Color.clear,
                            Color(hex: 0x2d1b4e).opacity(0.2)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                }
            } else {
                // Day theme - beautiful blue/sky gradient
                ZStack {
                    LinearGradient(
                        colors: [
                            Color(hex: 0xe3f2fd),
                            Color(hex: 0xbbdefb),
                            Color(hex: 0x90caf9)
                        ],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                    
                    // Subtle pattern overlay
                    LinearGradient(
                        colors: [
                            Color(hex: 0x64b5f6).opacity(0.2),
                            Color.clear,
                            Color(hex: 0x42a5f5).opacity(0.15)
                        ],
                        startPoint: .top,
                        endPoint: .bottom
                    )
                }
            }
        }
    }
    
    private var headerView: some View {
        VStack(spacing: 0) {
            HStack {
                Spacer()
                
                Text("تمرین تایپ ده انگشتی")
                    .font(.system(size: 20, weight: .semibold))
                    .foregroundColor(isNightMode ? .white : Color(hex: 0x1565c0))
                
                Spacer()
                
                // Day/Night mode toggle
                Button(action: {
                    withAnimation(.easeInOut(duration: 0.3)) {
                        isNightMode.toggle()
                    }
                }) {
                    HStack(spacing: 6) {
                        Image(systemName: isNightMode ? "moon.fill" : "sun.max.fill")
                            .font(.system(size: 14))
                        Text(isNightMode ? "حالت شب" : "حالت روز")
                            .font(.system(size: 14))
                    }
                    .foregroundColor(isNightMode ? .white : Color(hex: 0x1565c0))
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(
                        isNightMode ? Color(hex: 0x2a2a2a).opacity(0.6) : Color.white.opacity(0.8)
                    )
                    .cornerRadius(8)
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 20)
            .padding(.vertical, 15)
            
            // Control buttons row
            HStack(spacing: 20) {
                Button(action: {}) {
                    Image(systemName: "line.3.horizontal")
                        .font(.system(size: 16))
                        .foregroundColor(isNightMode ? .white.opacity(0.7) : Color(hex: 0x1565c0).opacity(0.7))
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: {
                    model.resetPractice()
                    timer?.invalidate()
                }) {
                    Image(systemName: "arrow.counterclockwise")
                        .font(.system(size: 16))
                        .foregroundColor(isNightMode ? .white.opacity(0.7) : Color(hex: 0x1565c0).opacity(0.7))
                }
                .buttonStyle(PlainButtonStyle())
                
                Button(action: {}) {
                    Image(systemName: "square.grid.2x2")
                        .font(.system(size: 16))
                        .foregroundColor(isNightMode ? .white.opacity(0.7) : Color(hex: 0x1565c0).opacity(0.7))
                }
                .buttonStyle(PlainButtonStyle())
            }
            .padding(.horizontal, 20)
            .padding(.bottom, 10)
        }
        .background(
            isNightMode ? Color(hex: 0x1a1a1a).opacity(0.3) : Color.white.opacity(0.2)
        )
    }
    
    func startTimer() {
        timer?.invalidate()
        timer = Timer.scheduledTimer(withTimeInterval: 1.0, repeats: true) { _ in
            timeUpdate += 1
        }
    }
    
    private var statisticsRow: some View {
        HStack(spacing: 30) {
            // Time
            StatItem(
                icon: "clock",
                label: "زمان",
                value: formatTime(),
                isNightMode: isNightMode
            )
            
            // Speed
            StatItem(
                icon: "rocket",
                label: "سرعت",
                value: String(format: "%.0f کلمه در دقیقه", model.wpm),
                isNightMode: isNightMode
            )
            
            // Errors
            StatItem(
                icon: "exclamationmark.triangle",
                label: "خطاها",
                value: "\(model.errors)",
                isNightMode: isNightMode
            )
        }
    }
    
    private var typingTextArea: some View {
        ScrollViewReader { proxy in
            ScrollView {
                VStack(alignment: .center, spacing: 12) {
                    if !model.currentText.isEmpty {
                        let fullText = model.currentText
                        let currentIndex = model.currentIndex
                        
                        // Split into words for display (like before)
                        let words = fullText.split(separator: " ")
                        
                        // Calculate character positions
                        var charCount = 0
                        let wordPositions = words.map { word -> (String, Int, Int) in
                            let start = charCount
                            let end = charCount + word.count
                            charCount = end + 1 // +1 for space
                            return (String(word), start, end)
                        }
                        
                        ForEach(Array(wordPositions.enumerated()), id: \.offset) { index, wordData in
                            let (word, wordStart, wordEnd) = wordData
                            
                            HStack(spacing: 4) {
                                if wordEnd <= currentIndex {
                                    // Fully typed word - green
                                    Text(word)
                                        .foregroundColor(.green)
                                        .font(.system(size: 24, design: .monospaced))
                                } else if wordStart < currentIndex {
                                    // Current word being typed
                                    let typedInWord = currentIndex - wordStart
                                    let wordStr = word
                                    
                                    // Typed part - green
                                    if typedInWord > 0 {
                                        Text(String(wordStr.prefix(typedInWord)))
                                            .foregroundColor(.green)
                                            .font(.system(size: 24, design: .monospaced))
                                    }
                                    
                                    // Current character - blue highlight
                                    if typedInWord < wordStr.count {
                                        let currentChar = wordStr[wordStr.index(wordStr.startIndex, offsetBy: typedInWord)]
                                        Text(String(currentChar))
                                            .foregroundColor(.white)
                                            .font(.system(size: 24, weight: .bold, design: .monospaced))
                                            .padding(.horizontal, 4)
                                            .padding(.vertical, 2)
                                            .background(Color.blue)
                                            .cornerRadius(4)
                                    }
                                    
                                    // Remaining part - red
                                    if typedInWord < wordStr.count - 1 {
                                        let remainingStart = wordStr.index(wordStr.startIndex, offsetBy: typedInWord + 1)
                                        Text(String(wordStr[remainingStart...]))
                                            .foregroundColor(.red)
                                            .font(.system(size: 24, design: .monospaced))
                                    }
                                    
                                    // Cursor
                                    Text("_")
                                        .foregroundColor(isNightMode ? .white.opacity(0.5) : Color(hex: 0x1565c0).opacity(0.5))
                                        .font(.system(size: 24, design: .monospaced))
                                } else {
                                    // Not started word - gray
                                    Text(word)
                                        .foregroundColor(isNightMode ? .gray.opacity(0.6) : Color(hex: 0x1565c0).opacity(0.4))
                                        .font(.system(size: 24, design: .monospaced))
                                }
                            }
                            .id("word-\(index)")
                        }
                    }
                }
                .frame(maxWidth: .infinity)
                .padding(.vertical, 60)
                .padding(.horizontal, 40)
            }
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(isNightMode ? Color(hex: 0x1a1a1a).opacity(0.4) : Color.white.opacity(0.6))
            )
            .onChange(of: model.currentIndex) { _, _ in
                // Auto-scroll to current word
                let words = model.currentText.split(separator: " ")
                var charCount = 0
                var currentWordIndex = 0
                
                for (index, word) in words.enumerated() {
                    if model.currentIndex >= charCount && model.currentIndex < charCount + word.count {
                        currentWordIndex = index
                        break
                    }
                    charCount += word.count + 1
                }
                
                withAnimation(.easeInOut(duration: 0.3)) {
                    proxy.scrollTo("word-\(currentWordIndex)", anchor: UnitPoint.center)
                }
            }
        }
    }
    
    private var virtualKeyboard: some View {
        VStack(spacing: 10) {
            // Number row
            HStack(spacing: 5) {
                ForEach(["`", "1", "2", "3", "4", "5", "6", "7", "8", "9", "0", "-", "="], id: \.self) { key in
                    BeautifulKeyView(
                        key: key,
                        finger: getFingerForKey(key),
                        isCurrent: isCurrentKey(key),
                        isNightMode: isNightMode
                    )
                }
            }
            
            // QWERTY row
            HStack(spacing: 5) {
                BeautifulKeyView(key: "Tab", finger: .pinky, width: 75, isCurrent: false, isNightMode: isNightMode)
                ForEach(["q", "w", "e", "r", "t", "y", "u", "i", "o", "p", "[", "]"], id: \.self) { key in
                    BeautifulKeyView(
                        key: key,
                        finger: getFingerForKey(key),
                        isCurrent: isCurrentKey(key),
                        isNightMode: isNightMode
                    )
                }
                BeautifulKeyView(key: "\\", finger: .pinky, width: 75, isCurrent: false, isNightMode: isNightMode)
            }
            
            // ASDF row
            HStack(spacing: 5) {
                BeautifulKeyView(key: "Caps", finger: .pinky, width: 85, isCurrent: false, isNightMode: isNightMode)
                ForEach(["a", "s", "d", "f", "g", "h", "j", "k", "l", ";", "'"], id: \.self) { key in
                    BeautifulKeyView(
                        key: key,
                        finger: getFingerForKey(key),
                        isCurrent: isCurrentKey(key),
                        isNightMode: isNightMode
                    )
                }
                BeautifulKeyView(key: "Return", finger: .pinky, width: 110, isCurrent: false, isNightMode: isNightMode)
            }
            
            // ZXCV row
            HStack(spacing: 5) {
                BeautifulKeyView(key: "Shift", finger: .pinky, width: 95, isCurrent: false, isNightMode: isNightMode)
                ForEach(["z", "x", "c", "v", "b", "n", "m", ",", ".", "/"], id: \.self) { key in
                    BeautifulKeyView(
                        key: key,
                        finger: getFingerForKey(key),
                        isCurrent: isCurrentKey(key),
                        isNightMode: isNightMode
                    )
                }
                BeautifulKeyView(key: "Shift", finger: .pinky, width: 95, isCurrent: false, isNightMode: isNightMode)
            }
            
            // Space bar row
            HStack(spacing: 5) {
                BeautifulKeyView(key: "Ctrl", finger: .pinky, width: 65, isCurrent: false, isNightMode: isNightMode)
                BeautifulKeyView(key: "Option", finger: .pinky, width: 65, isCurrent: false, isNightMode: isNightMode)
                BeautifulKeyView(key: "Cmd", finger: .thumb, width: 65, isCurrent: false, isNightMode: isNightMode)
                BeautifulKeyView(key: "Space", finger: .thumb, width: 320, isCurrent: isCurrentKey(" "), isNightMode: isNightMode)
                BeautifulKeyView(key: "Cmd", finger: .thumb, width: 65, isCurrent: false, isNightMode: isNightMode)
                BeautifulKeyView(key: "Option", finger: .pinky, width: 65, isCurrent: false, isNightMode: isNightMode)
            }
        }
        .padding(20)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(isNightMode ? Color(hex: 0x2a2a2a).opacity(0.6) : Color.white.opacity(0.7))
                .shadow(color: .black.opacity(0.2), radius: 10, x: 0, y: 5)
        )
    }
    
    func formatTime() -> String {
        guard let startTime = model.startTime else { return "۰۰:۰۰" }
        let elapsed = Int(Date().timeIntervalSince(startTime))
        let minutes = elapsed / 60
        let seconds = elapsed % 60
        return persianNumber(String(format: "%02d:%02d", minutes, seconds))
    }
    
    func persianNumber(_ text: String) -> String {
        let persianDigits = ["۰", "۱", "۲", "۳", "۴", "۵", "۶", "۷", "۸", "۹"]
        var result = ""
        for char in text {
            if let digit = Int(String(char)) {
                result += persianDigits[digit]
            } else {
                result += String(char)
            }
        }
        return result
    }
    
    func isCurrentKey(_ key: String) -> Bool {
        guard let currentChar = model.getCurrentCharacter() else { return false }
        let keyLower = key.lowercased()
        let charLower = currentChar.lowercased()
        
        // Handle space
        if key == " " || key == "Space" {
            return currentChar == " "
        }
        
        // Handle special characters
        if key == "Return" || key == "Enter" {
            return currentChar == "\n"
        }
        
        // Direct character match (case-insensitive for letters)
        if keyLower == charLower {
            return true
        }
        
        // Handle exact character match for punctuation and numbers
        if key == currentChar {
            return true
        }
        
        // Handle punctuation mapping
        let punctuationMap: [String: [String]] = [
            "`": ["`", "~"],
            "1": ["1", "!"],
            "2": ["2", "@"],
            "3": ["3", "#"],
            "4": ["4", "$"],
            "5": ["5", "%"],
            "6": ["6", "^"],
            "7": ["7", "&"],
            "8": ["8", "*"],
            "9": ["9", "("],
            "0": ["0", ")"],
            "-": ["-", "_"],
            "=": ["=", "+"],
            "[": ["[", "{"],
            "]": ["]", "}"],
            ";": [";", ":"],
            "'": ["'", "\""],
            ",": [",", "<"],
            ".": [".", ">"],
            "/": ["/", "?"],
            "\\": ["\\", "|"]
        ]
        
        if let mapped = punctuationMap[key] {
            return mapped.contains(currentChar)
        }
        
        return false
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
    
    enum Finger {
        case pinky
        case ring
        case middle
        case index
        case thumb
    }
}

struct StatItem: View {
    let icon: String
    let label: String
    let value: String
    let isNightMode: Bool
    
    var body: some View {
        HStack(spacing: 8) {
            Image(systemName: icon)
                .font(.system(size: 14))
                .foregroundColor(isNightMode ? .white.opacity(0.7) : Color(hex: 0x1565c0).opacity(0.7))
            
            Text(label)
                .font(.system(size: 14))
                .foregroundColor(isNightMode ? .white.opacity(0.7) : Color(hex: 0x1565c0).opacity(0.7))
            
            Text(":")
                .foregroundColor(isNightMode ? .white.opacity(0.7) : Color(hex: 0x1565c0).opacity(0.7))
            
            Text(value)
                .font(.system(size: 14, weight: .semibold))
                .foregroundColor(isNightMode ? .white : Color(hex: 0x1565c0))
        }
    }
}

struct BeautifulKeyView: View {
    let key: String
    let finger: ContentView.Finger
    var width: CGFloat = 45
    var isCurrent: Bool = false
    var isNightMode: Bool = true
    
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
            .font(.system(size: 12, weight: .semibold, design: .rounded))
            .foregroundColor(isCurrent ? .white : (isNightMode ? .white : Color(hex: 0x1565c0)))
            .frame(width: width, height: 45)
            .background(
                ZStack {
                    if isCurrent {
                        // Current key - bright blue with glow
                        RoundedRectangle(cornerRadius: 8)
                            .fill(
                                LinearGradient(
                                    colors: [Color.blue, Color.blue.opacity(0.8)],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                            .shadow(color: .blue.opacity(0.8), radius: 12, x: 0, y: 0)
                    } else {
                        // Normal key with finger color
                        RoundedRectangle(cornerRadius: 8)
                            .fill(
                                isNightMode ?
                                fingerColor.opacity(0.2) :
                                fingerColor.opacity(0.15)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 8)
                                    .stroke(
                                        isNightMode ?
                                        fingerColor.opacity(0.4) :
                                        fingerColor.opacity(0.3),
                                        lineWidth: 1.5
                                    )
                            )
                    }
                }
            )
            .shadow(
                color: isCurrent ? .blue.opacity(0.5) : .black.opacity(0.2),
                radius: isCurrent ? 8 : 2,
                x: 0,
                y: isCurrent ? 4 : 1
            )
    }
}

#Preview {
    ContentView()
        .environmentObject(TypingPracticeModel())
        .frame(width: 1200, height: 800)
}
