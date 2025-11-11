//
//  TypingPracticeApp.swift
//  hhh
//
//  Main app entry point
//

import SwiftUI

@main
struct TypingPracticeApp: App {
    @StateObject private var practiceModel = TypingPracticeModel()
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(practiceModel)
                .frame(minWidth: 1000, minHeight: 700)
        }
        .windowStyle(.automatic)
        .commands {
            CommandGroup(replacing: .newItem) {}
        }
    }
}

