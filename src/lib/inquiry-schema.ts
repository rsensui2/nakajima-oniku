import { z } from "zod";

export const inquirySchema = z.object({
  name: z.string().min(1, "お名前を入力してください").max(80),
  email: z.string().email("有効なメールアドレスを入力してください"),
  phone: z.string().max(30).optional().or(z.literal("")),
  partySize: z.coerce.number().int().min(1).max(20),
  cookingMethod: z.enum(["steak", "yakiniku", "shabu", "roast", "other"]),
  message: z.string().min(1, "ご希望を入力してください").max(2000),
});

export type InquiryInput = z.infer<typeof inquirySchema>;

export const cookingMethodLabels: Record<InquiryInput["cookingMethod"], string> = {
  steak: "ステーキ",
  yakiniku: "焼肉",
  shabu: "しゃぶしゃぶ・鍋",
  roast: "ロースト・低温調理",
  other: "その他・相談したい",
};
