//
//  TypingPracticeModel.swift
//  hhh
//
//  Created for typing practice app
//

import Foundation
import SwiftUI

enum PracticeLanguage: String, CaseIterable {
    case persian = "فارسی"
    case english = "English"
}

class TypingPracticeModel: ObservableObject {
    @Published var currentText: String = ""
    @Published var userInput: String = ""
    @Published var currentIndex: Int = 0
    @Published var isActive: Bool = false
    @Published var startTime: Date?
    @Published var errors: Int = 0
    @Published var totalCharacters: Int = 0
    @Published var correctCharacters: Int = 0
    @Published var selectedLanguage: PracticeLanguage = .persian
    @Published var wpm: Double = 0.0
    @Published var accuracy: Double = 100.0
    
    // Persian practice texts - meaningful and diverse, using all letters
    let persianTexts = [
        "کیش کیست شیک تیک نیک بیک بیسیم نسیم مشکین تشک تشکیک شکیب سبب مسبب تسنیم تسکین مسکن بیش بنشین کشتی سیستم شیب شیمی شن کش مکش کشمش تکنیک ممکن",
        "برنامه‌نویسی یکی از مهارت‌های مهم در دنیای امروز است. یادگیری تایپ سریع و دقیق می‌تواند به شما کمک کند تا کارهای خود را سریع‌تر انجام دهید. تمرین مداوم باعث پیشرفت می‌شود.",
        "سلام بر شما دوستان عزیز. امروز می‌خواهیم درباره اهمیت تایپ ده انگشتی صحبت کنیم. این مهارت در دنیای دیجیتال امروز بسیار ارزشمند است و می‌تواند سرعت کار شما را به طور چشمگیری افزایش دهد.",
        "کامپیوتر و اینترنت بخش مهمی از زندگی روزمره ما شده‌اند. تایپ سریع می‌تواند در کار و تحصیل به شما کمک زیادی کند. با تمرین روزانه می‌توانید به سرعت بالایی برسید.",
        "زبان فارسی یکی از زیباترین زبان‌های جهان است. با تمرین تایپ می‌توانید ارتباطات خود را بهبود بخشید. هر روز چند دقیقه وقت بگذارید و به تدریج پیشرفت خود را مشاهده خواهید کرد.",
        "دانش و علم در هر زمان و مکانی ارزشمند است. یادگیری مهارت‌های جدید مانند تایپ ده انگشتی می‌تواند آینده شما را روشن‌تر کند. صبر و حوصله کلید موفقیت است.",
        "تکنولوژی و فناوری روز به روز در حال پیشرفت است. برای همگام شدن با این تغییرات، باید مهارت‌های خود را به‌روز نگه داریم. تایپ سریع یکی از این مهارت‌هاست.",
        "کتاب و مطالعه همیشه بهترین دوست انسان بوده‌اند. با خواندن کتاب‌های مختلف می‌توانیم دانش خود را افزایش دهیم. تایپ کردن نیز یک هنر است که نیاز به تمرین دارد."
    ]
    
    // English practice texts - meaningful and diverse, using all letters
    let englishTexts = [
        "The quick brown fox jumps over the lazy dog. This sentence contains every letter of the alphabet and is perfect for typing practice. Keep practicing to improve your speed.",
        "Practice makes perfect. The more you type, the better you will become at touch typing. Keep practicing every day to improve your speed and accuracy. Consistency is key to success.",
        "Touch typing is a skill that requires patience and dedication. With regular practice, you can learn to type without looking at the keyboard. This will make you more productive.",
        "Technology has become an essential part of our daily lives. Learning to type quickly and accurately can help you work more efficiently. Every professional should master this skill.",
        "Programming and software development require good typing skills. Practice touch typing to become a better developer and improve your productivity. Code faster, achieve more.",
        "Education and knowledge are the foundations of success. Learning new skills like touch typing can open many doors for you. Invest in yourself and your future today.",
        "Reading books and articles helps expand your mind. Writing and typing are essential skills in the modern world. Master these skills to communicate effectively with others.",
        "Science and innovation drive human progress forward. Scientists and researchers work tirelessly to discover new things. Technology connects us all in amazing ways."
    ]
    
    var currentPracticeText: String {
        switch selectedLanguage {
        case .persian:
            return persianTexts.randomElement() ?? persianTexts[0]
        case .english:
            return englishTexts.randomElement() ?? englishTexts[0]
        }
    }
    
    func startPractice() {
        currentText = currentPracticeText
        userInput = ""
        currentIndex = 0
        isActive = true
        startTime = Date()
        errors = 0
        totalCharacters = 0
        correctCharacters = 0
        wpm = 0.0
        accuracy = 100.0
    }
    
    func resetPractice() {
        isActive = false
        userInput = ""
        currentIndex = 0
        startTime = nil
        errors = 0
        totalCharacters = 0
        correctCharacters = 0
        wpm = 0.0
        accuracy = 100.0
    }
    
    func handleInput(_ character: String) {
        // Auto-start if not active
        if !isActive && !currentText.isEmpty {
            startPractice()
        }
        
        guard isActive, !currentText.isEmpty else { return }
        
        if currentIndex < currentText.count {
            let expectedChar = String(currentText[currentText.index(currentText.startIndex, offsetBy: currentIndex)])
            
            if character == expectedChar {
                correctCharacters += 1
                currentIndex += 1
                if currentIndex <= currentText.count {
                    userInput = String(currentText.prefix(currentIndex))
                }
            } else {
                errors += 1
                // Don't advance on error - user needs to type the correct character
            }
            
            totalCharacters += 1
            updateStatistics()
            
            // Check if practice is complete
            if currentIndex >= currentText.count {
                isActive = false
            }
        }
    }
    
    func updateStatistics() {
        guard let startTime = startTime else { return }
        
        let elapsedTime = Date().timeIntervalSince(startTime)
        let minutes = elapsedTime / 60.0
        
        if minutes > 0 && totalCharacters > 0 {
            // WPM calculation: (characters typed / 5) / minutes
            wpm = Double(totalCharacters) / 5.0 / minutes
            
            // Accuracy calculation
            if totalCharacters > 0 {
                accuracy = Double(correctCharacters) / Double(totalCharacters) * 100.0
            }
        }
    }
    
    func getCurrentCharacter() -> String? {
        guard currentIndex < currentText.count else { return nil }
        return String(currentText[currentText.index(currentText.startIndex, offsetBy: currentIndex)])
    }
    
    func getTypedText() -> String {
        return userInput
    }
    
    func getRemainingText() -> String {
        guard currentIndex < currentText.count else { return "" }
        let startIndex = currentText.index(currentText.startIndex, offsetBy: currentIndex)
        return String(currentText[startIndex...])
    }
    
    func changeLanguage(_ language: PracticeLanguage) {
        selectedLanguage = language
        resetPractice()
        currentText = currentPracticeText
    }
}
