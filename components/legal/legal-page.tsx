'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { BrandMark } from '@/components/app-shell'
import { useLang } from '@/lib/i18n'

type Section = { title: string; titleBn: string; body: string[]; bodyBn: string[] }

const TERMS: Section[] = [
  {
    title: '1. The service',
    titleBn: '১. সেবা',
    body: [
      'Tokio is a chat-to-order platform connecting shoppers and merchants in Bangladesh. Shoppers negotiate and confirm orders in a single conversation; merchants manage those orders, couriers and reviews in one dashboard.',
      'Tokio provides the tooling — messaging, order capture, courier tracking and reviews — but the contract of sale is between the shopper and the merchant.',
    ],
    bodyBn: [
      'Tokio হলো বাংলাদেশের ক্রেতা ও বিক্রেতাদের যুক্ত করা চ্যাট-টু-অর্ডার প্ল্যাটফর্ম। ক্রেতারা একটি কথোপকথনে দরদাম ও অর্ডার নিশ্চিত করেন; বিক্রেতারা সেই অর্ডার, কুরিয়ার ও রিভিউ এক ড্যাশবোর্ডে পরিচালনা করেন।',
      'Tokio সরঞ্জাম দেয় — মেসেজিং, অর্ডার ক্যাপচার, কুরিয়ার ট্র্যাকিং ও রিভিউ — কিন্তু বিক্রির চুক্তি ক্রেতা ও বিক্রেতার মধ্যে হয়।',
    ],
  },
  {
    title: '2. Your account',
    titleBn: '২. আপনার অ্যাকাউন্ট',
    body: [
      'You must provide accurate information when creating an account, keep your credentials confidential, and be at least 18 years old or have the consent of a guardian.',
      'You are responsible for all activity that happens under your account. Tell us immediately if you suspect unauthorized use.',
      'Merchants are responsible for the accuracy of their business details — name, category, pickup address and contact information — shown to shoppers.',
    ],
    bodyBn: [
      'অ্যাকাউন্ট তৈরির সময় সঠিক তথ্য দিন, আপনার শংসাপত্র গোপন রাখুন এবং বয়স কমপক্ষে ১৮ বছর হতে হবে বা অভিভাবকের সম্মতি লাগবে।',
      'আপনার অ্যাকাউন্টে হওয়া সব কার্যকলাপের দায় আপনার। অননুমোদিত ব্যবহারের সন্দেহ হলে এখনই আমাদের জানান।',
      'বিক্রেতারা ক্রেতাদের দেখানো নিজেদের ব্যবসার তথ্যের — নাম, ক্যাটাগরি, পিকআপ ঠিকানা ও যোগাযোগের তথ্য — সঠিকতার জন্য দায়বদ্ধ।',
    ],
  },
  {
    title: '3. Orders, payments and delivery',
    titleBn: '৩. অর্ডার, পেমেন্ট ও ডেলিভারি',
    body: [
      'Orders confirmed in Tokio are commitments between shopper and merchant. Tokio is not a party to the transaction and does not hold funds.',
      'Cash on delivery and bKash payments are settled directly between the parties or their payment providers.',
      'Delivery times shown in tracking are provided by the courier and are estimates, not guarantees.',
    ],
    bodyBn: [
      'Tokio-তে নিশ্চিত অর্ডার ক্রেতা ও বিক্রেতার মধ্যে প্রতিশ্রুতি। Tokio লেনদেনের পক্ষ নয় এবং অর্থ ধারণ করে না।',
      'ক্যাশ অন ডেলিভারি ও বিকাশ পেমেন্ট সরাসরি পক্ষগুলো বা তাদের পেমেন্ট প্রদানকারীর মাধ্যমে পরিশোধ হয়।',
      'ট্র্যাকিংয়ে দেখানো ডেলিভারির সময় কুরিয়ার দেয় এবং তা আনুমানিক, গ্যারান্টি নয়।',
    ],
  },
  {
    title: '4. Acceptable use',
    titleBn: '৪. গ্রহণযোগ্য ব্যবহার',
    body: [
      'You may not use Tokio to sell prohibited, counterfeit or illegal goods, to harass other users, to submit fake orders or reviews, or to interfere with the service.',
      'Reviews must reflect genuine experiences. Merchants may not post reviews of their own products.',
      'We may suspend accounts that violate these rules, with or without notice depending on severity.',
    ],
    bodyBn: [
      'নিষিদ্ধ, নকল বা বেআইনি পণ্য বিক্রি, অন্য ব্যবহারকারীকে হয়রানি, ভুয়া অর্ডার বা রিভিউ জমা দেওয়া, বা সেবায় হস্তক্ষেপ করতে Tokio ব্যবহার করা যাবে না।',
      'রিভিউতে প্রকৃত অভিজ্ঞতা প্রতিফলিত হতে হবে। বিক্রেতারা নিজেদের পণ্যের রিভিউ দিতে পারবেন না।',
      'এই নিয়ম ভাঙা অ্যাকাউন্ট আমরা ঘোষণা সহকারে বা ছাড়া, গুরুতরতা অনুযায়ী, স্থগিত করতে পারি।',
    ],
  },
  {
    title: '5. Liability',
    titleBn: '৫. দায়বদ্ধতা',
    body: [
      'Tokio is provided "as is". To the maximum extent permitted by law, we are not liable for lost profits, undelivered orders, or disputes between shoppers and merchants.',
      'Nothing in these terms limits liability that cannot be limited under the laws of Bangladesh.',
    ],
    bodyBn: [
      'Tokio "যেমন আছে" ভিত্তিতে দেওয়া হয়। আইনের অনুমতি অনুযায়ী, হারানো মুনাফা, ডেলিভারি না হওয়া অর্ডার বা ক্রেতা-বিক্রেতা বিরোধের জন্য আমরা দায়বদ্ধ নই।',
      'বাংলাদেশের আইনে যে দায়বদ্ধতা সীমাবদ্ধ করা যায় না, এই শর্তাবলীর কিছুই তা সীমিত করে না।',
    ],
  },
]

const PRIVACY: Section[] = [
  {
    title: 'What we collect',
    titleBn: 'আমরা যা সংগ্রহ করি',
    body: [
      'Account details — your name, email address, phone number, and for merchants your business name, category, website and pickup address.',
      'Your content — chat messages, orders, delivery addresses, reviews and photos you upload.',
      'Usage data — pages viewed, features used, and technical logs needed to keep the service reliable and secure.',
    ],
    bodyBn: [
      'অ্যাকাউন্টের তথ্য — আপনার নাম, ইমেল, ফোন নম্বর, আর বিক্রেতাদের ক্ষেত্রে ব্যবসার নাম, ক্যাটাগরি, ওয়েবসাইট ও পিকআপ ঠিকানা।',
      'আপনার কনটেন্ট — চ্যাট মেসেজ, অর্ডার, ডেলিভারি ঠিকানা, রিভিউ ও আপলোড করা ছবি।',
      'ব্যবহারের তথ্য — দেখা পেজ, ব্যবহৃত ফিচার, এবং সেবা নির্ভরযোগ্য ও নিরাপদ রাখতে প্রয়োজনীয় প্রযুক্তিগত লগ।',
    ],
  },
  {
    title: 'How we use it',
    titleBn: 'আমরা কীভাবে ব্যবহার করি',
    body: [
      'To run the service: authenticating you, storing conversations and orders, syncing them across your devices in real time, and delivering courier updates.',
      'To keep the platform safe: verifying phone numbers, preventing fake orders, and enforcing our Terms of Service.',
      'We do not sell your personal data, and we do not use your private messages for advertising.',
    ],
    bodyBn: [
      'সেবা চালাতে: আপনাকে প্রমাণীকরণ, কথোপকথন ও অর্ডার সংরক্ষণ, আপনার ডিভাইসে রিয়েল-টাইম সিঙ্ক, এবং কুরিয়ার আপডেট পাঠানো।',
      'প্ল্যাটফর্ম নিরাপদ রাখতে: ফোন নম্বর যাচাই, ভুয়া অর্ডার প্রতিরোধ, এবং আমাদের সেবার শর্তাবলী প্রয়োগ।',
      'আমরা আপনার ব্যক্তিগত তথ্য বিক্রি করি না, এবং ব্যক্তিগত মেসেজ বিজ্ঞাপনে ব্যবহার করি না।',
    ],
  },
  {
    title: 'Who can see what',
    titleBn: 'কে কী দেখতে পায়',
    body: [
      'Merchants see your display name, delivery address, and whether your phone number is verified — never the number itself.',
      'Reviews are public and show your name and rating.',
      'Service providers that run Tokio (database, authentication, storage and realtime infrastructure) process data only to provide the service.',
    ],
    bodyBn: [
      'বিক্রেতারা আপনার প্রদর্শিত নাম, ডেলিভারি ঠিকানা এবং ফোন যাচাইকৃত কি না তা দেখেন — নম্বরটি কখনোই না।',
      'রিভিউ প্রকাশ্য এবং আপনার নাম ও রেটিং দেখায়।',
      'Tokio চালানো সেবা প্রদানকারীরা (ডেটাবেস, প্রমাণীকরণ, স্টোরেজ ও রিয়েলটাইম পরিকাঠামো) শুধু সেবা দিতে তথ্য প্রক্রিয়া করে।',
    ],
  },
  {
    title: 'Your choices',
    titleBn: 'আপনার পছন্দ',
    body: [
      'You can clear your chat and order history anytime from the sidebar’s “Clear my data” option.',
      'You can sign out at any time, and request account deletion by contacting support.',
      'You may disable translation previews in the chat header; preferences are stored on your device.',
    ],
    bodyBn: [
      'সাইডবারের "আমার ডেটা মুছুন" থেকে যেকোনো সময় চ্যাট ও অর্ডার ইতিহাস মুছতে পারেন।',
      'যেকোনো সময় সাইন আউট করতে পারেন, এবং সাপোর্টে যোগাযোগ করে অ্যাকাউন্ট মুছতে বলতে পারেন।',
      'চ্যাট হেডার থেকে অনুবাদ প্রিভিউ বন্ধ করতে পারেন; পছন্দ আপনার ডিভাইসে সংরক্ষিত থাকে।',
    ],
  },
  {
    title: 'Data retention & security',
    titleBn: 'তথ্য সংরক্ষণ ও নিরাপত্তা',
    body: [
      'We keep your data while your account is active. Backups and logs are retained briefly for reliability, then removed.',
      'Data is encrypted in transit and stored in access-controlled infrastructure. No system is perfectly secure — report vulnerabilities to us and we will act quickly.',
    ],
    bodyBn: [
      'অ্যাকাউন্ট সক্রিয় থাকা পর্যন্ত আপনার তথ্য রাখি। নির্ভরযোগ্যতার জন্য ব্যাকআপ ও লগ অল্পসময় রাখা হয়, তারপর মুছে ফেলা হয়।',
      'তথ্য ট্রানজিটে এনক্রিপ্ট করা এবং নিয়ন্ত্রিত-অ্যাক্সেস পরিকাঠামোতে সংরক্ষিত। কোনো সিস্টেম পুরো নিরাপদ নয় — দুর্বলতা আমাদের জানালে দ্রুত ব্যবস্থা নেব।',
    ],
  },
]

export function LegalPage({ kind }: { kind: 'terms' | 'privacy' }) {
  const { lang, t } = useLang()
  const sections = kind === 'terms' ? TERMS : PRIVACY
  const title = kind === 'terms' ? t('terms.title') : t('privacy.title')

  return (
    <div className="min-h-dvh bg-background">
      <div className="mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/auth"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden />
          {t('terms.back')}
        </Link>
        <div className="mt-6 mb-8 flex items-center gap-3">
          <BrandMark className="size-10 rounded-xl" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
            <p className="text-sm text-muted-foreground">{t('legal.updated')}</p>
          </div>
        </div>
        <div className="space-y-8">
          {sections.map((s) => (
            <section key={s.title} id={s.title.includes('Acceptable') ? 'acceptable-use' : undefined}>
              <h2 className="mb-2 font-semibold">{lang === 'bn' ? s.titleBn : s.title}</h2>
              {(lang === 'bn' ? s.bodyBn : s.body).map((p, i) => (
                <p key={i} className="mb-2 text-sm leading-relaxed text-muted-foreground">
                  {p}
                </p>
              ))}
            </section>
          ))}
        </div>
        <p className="mt-12 border-t pt-6 text-center text-xs text-muted-foreground">
          © 2026 Tokio. All rights reserved.
        </p>
      </div>
    </div>
  )
}
