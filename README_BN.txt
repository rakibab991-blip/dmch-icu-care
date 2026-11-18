DMCH ICU Care — Single User Edition (Prototype)
================================================

এই প্যাকেজটি Realme Pad 2 / Android Chrome-এর জন্য একটি offline-capable web app (PWA)।
এটি native Android APK নয়। APK বানাতে Android build/signing environment প্রয়োজন।

ইনস্টল করার সহজ পদ্ধতি:
1) ZIP ফাইলটি extract করুন।
2) app-টি HTTPS-এ host করতে হবে, কারণ Android Chrome service worker/PWA install-এর জন্য secure origin চায়।
   বিনামূল্যের static hosting (যেমন GitHub Pages) ব্যবহার করা যায়, তবে সেটআপে একটি কম্পিউটার/অ্যাকাউন্ট লাগতে পারে।
3) Hosting URL Android Chrome-এ খুলুন।
4) Chrome menu (⋮) > Install app অথবা Add to Home screen নির্বাচন করুন।
5) প্রথমবার খুলে কমপক্ষে 8 অক্ষরের শক্তিশালী password তৈরি করুন।
6) Backup নিয়মিত export করে নিরাপদ জায়গায় রাখুন।

গুরুত্বপূর্ণ:
- এই সংস্করণে রোগীর তথ্য browser localStorage-এ AES-GCM encryption সহ রাখা হয়; password PBKDF2 দিয়ে key derive করে।
- Browser data clear, app/browser uninstall, device reset বা storage corruption হলে local data হারাতে পারে। Encrypted backup নিয়মিত export করুন।
- Backup password হারালে তথ্য পুনরুদ্ধার করা যাবে না।
- এটি prototype; independent security audit, clinical validation, hospital IT approval এবং বাস্তব device testing হয়নি।
- Patient name/UHID/অন্যান্য identifiable data ব্যবহারের আগে DMCH কর্তৃপক্ষের অনুমোদন নিন।
- App চিকিৎসা সিদ্ধান্ত, dose calculation, alarm বা clinical recommendation দেয় না।
- Print layout browser/device অনুযায়ী পরিবর্তিত হতে পারে; clinical use-এর আগে A4 output যাচাই করুন।

বর্তমান সীমাবদ্ধতা:
- Investigation image/file attachment সরাসরি সংরক্ষণ নেই।
- Prescription ও discharge summary structured template এখনো পূর্ণাঙ্গ নয়।
- Follow-up reminder notification নেই।
- Multi-device sync নেই; ইচ্ছাকৃতভাবে single-device/local design।
- Password recovery নেই।
