import { DuaRecord } from "./types";

export const INITIAL_DEMO_DUAS: DuaRecord[] = [
  {
    id: "demo_dua_1",
    title: "ইলম ও জ্ঞান বৃদ্ধির দোয়া",
    plainTextPreview:
      "ইলম ও জ্ঞান বৃদ্ধির দোয়া রাব্বি যিদনি ইলমা। হে আমার পালনকর্তা! আমার জ্ঞান বৃদ্ধি করে দিন। পড়াশোনা ও জ্ঞানার্জনের পূর্বে বেশি বেশি পাঠ করার জন্য কুরআনুল কারিমের চমৎকার দোয়া।",
    richTextContent: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-title" },
          content: [{ type: "text", text: "ইলম ও জ্ঞান বৃদ্ধির দোয়া" }],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-pronunciation" },
          content: [{ type: "text", text: "রাব্বি যিদনি ইলমা।" }],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-meaning" },
          content: [
            {
              type: "text",
              text: "হে আমার পালনকর্তা! আমার জ্ঞান বৃদ্ধি করে দিন। (সুরা ত্বাহা: ১১৪)",
            },
          ],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-paragraph" },
          content: [
            {
              type: "text",
              text: "পড়াশোনা ও জ্ঞানার্জনের পূর্বে বেশি বেশি পাঠ করার জন্য কুরআনুল কারিমের চমৎকার দোয়া।",
            },
          ],
        },
      ],
    },
    createdAt: Date.now() - 50000,
    updatedAt: Date.now() - 50000,
    sortOrder: 0,
    schemaVersion: 1,
  },
  {
    id: "demo_dua_2",
    title: "অন্তরের স্থিরতা ও হেদায়েতের দোয়া",
    plainTextPreview:
      "অন্তরের স্থিরতা ও হেদায়েতের দোয়া ইয়া মুকাল্লিবাল কুলুব, ছাব্বিত কালবি আলা দীনিক। হে অন্তরের পরিবর্তনকারী! আমার অন্তরকে আপনার দ্বীনের উপর দৃঢ় রাখুন। রাসুলুল্লাহ (সা.) এই দোয়াটি সর্বাধিক পাঠ করতেন।",
    richTextContent: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-title" },
          content: [
            { type: "text", text: "অন্তরের স্থিরতা ও হেদায়েতের দোয়া" },
          ],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-pronunciation" },
          content: [
            {
              type: "text",
              text: "ইয়া মুকাল্লিবাল কুলুব, ছাব্বিত কালবি আলা দীনিক।",
            },
          ],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-meaning" },
          content: [
            {
              type: "text",
              text: "হে অন্তরের পরিবর্তনকারী! আমার অন্তরকে আপনার দ্বীনের উপর দৃঢ় রাখুন। (জামে তিরমিজি: ৩৫২২)",
            },
          ],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-paragraph" },
          content: [
            {
              type: "text",
              text: "রাসুলুল্লাহ (সা.) এই দোয়াটি সর্বাধিক পাঠ করতেন।",
            },
          ],
        },
      ],
    },
    createdAt: Date.now() - 40000,
    updatedAt: Date.now() - 40000,
    sortOrder: 1,
    schemaVersion: 1,
  },
  {
    id: "demo_dua_3",
    title: "ক্ষমা ও রহমতের দোয়া",
    plainTextPreview:
      "ক্ষমা ও রহমতের দোয়া রাব্বিগফির ওয়ারহাম ওয়া আনতা খাইরুর রাহিমিন। হে আমার পালনকর্তা! আপনি ক্ষমা করুন, দয়া করুন; আপনিই তো সর্বশ্রেষ্ঠ দয়ালু।",
    richTextContent: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-title" },
          content: [{ type: "text", text: "ক্ষমা ও রহমতের দোয়া" }],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-pronunciation" },
          content: [
            {
              type: "text",
              text: "রাব্বিগফির ওয়ারহাম ওয়া আনতা খাইরুর রাহিমিন।",
            },
          ],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-meaning" },
          content: [
            {
              type: "text",
              text: "হে আমার পালনকর্তা! আপনি ক্ষমা করুন, দয়া করুন; আপনিই তো সর্বশ্রেষ্ঠ দয়ালু। (সুরা আল-মুমিনুন: ১১৮)",
            },
          ],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-paragraph" },
          content: [
            {
              type: "text",
              text: "আল্লাহর অসীম রহমত ও ক্ষমা লাভের এক অনন্য দোয়া।",
            },
          ],
        },
      ],
    },
    createdAt: Date.now() - 30000,
    updatedAt: Date.now() - 30000,
    sortOrder: 2,
    schemaVersion: 1,
  },
  {
    id: "demo_dua_4",
    title: "কঠিন কাজ সহজ হওয়ার দোয়া",
    plainTextPreview:
      "কঠিন কাজ সহজ হওয়ার দোয়া আল্লাহুম্মা লা সাহলা ইল্লা মা জাআলতাহু সাহলা, ওয়া আনতা তাজআলুল হাযনা ইজা শিতা সাহলা। হে আল্লাহ! আপনি যা সহজ করে দেন তা ছাড়া কোনো কিছুই সহজ নয়...",
    richTextContent: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-title" },
          content: [{ type: "text", text: "কঠিন কাজ সহজ হওয়ার দোয়া" }],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-pronunciation" },
          content: [
            {
              type: "text",
              text: "আল্লাহুম্মা লা সাহলা ইল্লা মা জাআলতাহু সাহলা, ওয়া আনতা তাজআলুল হাযনা ইজা শিতা সাহলা।",
            },
          ],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-meaning" },
          content: [
            {
              type: "text",
              text: "হে আল্লাহ! আপনি যা সহজ করে দেন তা ছাড়া কোনো কিছুই সহজ নয়। আর আপনি চাইলে কঠিন বিষয়কেও সহজ করে দেন। (সহিহ ইবনে হিব্বান: ৯৭৪)",
            },
          ],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-paragraph" },
          content: [
            {
              type: "text",
              text: "পরীক্ষা, ইন্টারভিউ বা যেকোনো গুরুত্বপূর্ণ কাজের শুরুতে পড়ার দোয়া।",
            },
          ],
        },
      ],
    },
    createdAt: Date.now() - 20000,
    updatedAt: Date.now() - 20000,
    sortOrder: 3,
    schemaVersion: 1,
  },
  {
    id: "demo_dua_5",
    title: "পিতামাতার জন্য দোয়া",
    plainTextPreview:
      "পিতামাতার জন্য দোয়া রাব্বির হামহুমা কামা রাব্বায়ানি সাগিরা। হে আমার পালনকর্তা! তাদের উভয়ের প্রতি রহম করুন, যেমন তারা শৈশবে আমাকে লালন-পালন করেছেন।",
    richTextContent: {
      type: "doc",
      content: [
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-title" },
          content: [{ type: "text", text: "পিতামাতার জন্য দোয়া" }],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-pronunciation" },
          content: [
            { type: "text", text: "রাব্বির হামহুমা কামা রাব্বায়ানি সাগিরা।" },
          ],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-meaning" },
          content: [
            {
              type: "text",
              text: "হে আমার পালনকর্তা! তাদের উভয়ের প্রতি রহম করুন, যেমন তারা শৈশবে আমাকে লালন-পালন করেছেন। (সুরা বনি ইসরাইল: ২৪)",
            },
          ],
        },
        {
          type: "paragraph",
          attrs: { semanticStyle: "dua-paragraph" },
          content: [
            {
              type: "text",
              text: "পিতামাতার জন্য নিয়মিত দোয়া করা নেককার সন্তানের অন্যতম প্রধান দায়িত্ব।",
            },
          ],
        },
      ],
    },
    createdAt: Date.now() - 10000,
    updatedAt: Date.now() - 10000,
    sortOrder: 4,
    schemaVersion: 1,
  },
];
