# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: 09-advanced.spec.ts >> SignalR Real-Time >> Chat Hub - Browser SignalR Connection >> SignalR chat connection works in browser context
- Location: e2e\09-advanced.spec.ts:409:5

# Error details

```
Error: page.evaluate: TypeError: Failed to resolve module specifier '@microsoft/signalr'
    at eval (eval at evaluate (:302:30), <anonymous>:3:25)
    at UtilityScript.evaluate (<anonymous>:304:16)
    at UtilityScript.<anonymous> (<anonymous>:1:44)
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - img "code" [ref=e8]:
          - img [ref=e9]
        - generic [ref=e11]: CodexIQ
      - menu [ref=e12]:
        - menuitem "dashboard Dashboard" [ref=e13] [cursor=pointer]:
          - img "dashboard" [ref=e14]:
            - img [ref=e15]
          - generic [ref=e17]: Dashboard
        - menuitem "file-text Sınav Sonuçları" [ref=e18] [cursor=pointer]:
          - img "file-text" [ref=e19]:
            - img [ref=e20]
          - generic [ref=e22]: Sınav Sonuçları
        - menuitem "code Kod Test" [ref=e23] [cursor=pointer]:
          - img "code" [ref=e24]:
            - img [ref=e25]
          - generic [ref=e27]: Kod Test
        - menuitem "message Mesajlar" [ref=e28] [cursor=pointer]:
          - img "message" [ref=e29]:
            - img [ref=e30]
          - generic [ref=e32]: Mesajlar
        - menuitem "user Profil" [ref=e33] [cursor=pointer]:
          - img "user" [ref=e34]:
            - img [ref=e35]
          - generic [ref=e37]: Profil
      - generic [ref=e38]:
        - generic [ref=e40]: ÖĞ
        - generic [ref=e41]:
          - generic [ref=e42]: Öğrenci Adı
          - text: Bilgisayar Müh.
  - generic [ref=e43]:
    - banner [ref=e44]:
      - img "menu-fold" [ref=e46] [cursor=pointer]:
        - img [ref=e47]
      - generic [ref=e49]:
        - generic [ref=e50]:
          - button "sun" [ref=e51] [cursor=pointer]:
            - img "sun" [ref=e53]:
              - img [ref=e54]
          - button "global TR" [ref=e56] [cursor=pointer]:
            - img "global" [ref=e57]:
              - img [ref=e58]
            - generic [ref=e60]: TR
        - generic [ref=e61]:
          - img "bell" [ref=e62] [cursor=pointer]:
            - img [ref=e63]
          - superscript [ref=e65]:
            - generic [ref=e67]: "3"
        - generic [ref=e69] [cursor=pointer]: ÖĞ
    - main [ref=e70]:
      - generic [ref=e71]:
        - generic [ref=e72]:
          - heading "Mesajlar" [level=4] [ref=e73]
          - text: Öğretmenlerinizle iletişime geçin
        - generic [ref=e74]:
          - generic [ref=e80]: Öğretmen bulunamadı
          - generic [ref=e82]: Bir sohbet seçin
```