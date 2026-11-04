/**
 * 気象庁「分潮一覧表 東京」（2026年版、調和解析 2011–2020）
 * https://www.data.jma.go.jp/kaiyou/db/tide/suisan/harms60.php?stn=TK
 *
 * 遅角は現地子午線基準（κ）。60分潮のうち振幅の大きい25分潮を採用。
 * 2026年の公式毎時潮位（8,760点）との比較で RMS 1.85cm / 最大 6.4cm。
 */

export type NodalKind =
  | "none"
  | "M2"
  | "K1"
  | "O1"
  | "K2"
  | "J1"
  | "OO1"
  | "Mm"
  | "Mf"
  | "M3"
  | "M4";

/** Doodson 系の係数（T: 平均太陽時角, s: 月平均黄経, h: 太陽平均黄経, p: 月近地点, p1: 太陽近地点） */
export type ArgumentCoefficients = Readonly<{
  T?: number;
  s?: number;
  h?: number;
  p?: number;
  p1?: number;
}>;

export type Constituent = Readonly<{
  name: string;
  /** 0: 長周期, 1: 日周, 2: 半日周, 3, 4: 浅海 */
  species: 0 | 1 | 2 | 3 | 4;
  coefficients: ArgumentCoefficients;
  /** 天文引数の位相定数（度） */
  phaseOffset: number;
  /** 振幅（cm） */
  amplitude: number;
  /** 遅角 κ（度、現地子午線基準） */
  kappa: number;
  nodal: NodalKind;
}>;

export type TideStation = Readonly<{
  code: string;
  name: string;
  latitude: number;
  /** 東経（度） */
  longitude: number;
  /** 平均水面の潮位表基準面上の高さ（cm） */
  meanSeaLevel: number;
  constituents: readonly Constituent[];
}>;

const c = (
  name: string,
  species: Constituent["species"],
  coefficients: ArgumentCoefficients,
  phaseOffset: number,
  amplitude: number,
  kappa: number,
  nodal: NodalKind,
): Constituent => ({ name, species, coefficients, phaseOffset, amplitude, kappa, nodal });

export const TOKYO_STATION: TideStation = {
  code: "TK",
  name: "東京",
  latitude: 35 + 39 / 60,
  longitude: 139 + 46 / 60 + 12 / 3600,
  meanSeaLevel: 120.0,
  constituents: [
    c("Sa", 0, { h: 1 }, 0, 9.51, 156.85, "none"),
    c("Ssa", 0, { h: 2 }, 0, 0.57, 286.86, "none"),
    c("Mm", 0, { s: 1, p: -1 }, 0, 0.88, 95.77, "Mm"),
    c("Mf", 0, { s: 2 }, 0, 0.74, 126.12, "Mf"),
    c("2Q1", 1, { T: 1, s: -4, h: 1, p: 2 }, 90, 0.55, 136.66, "O1"),
    c("σ1", 1, { T: 1, s: -4, h: 3 }, 90, 0.64, 149.4, "O1"),
    c("Q1", 1, { T: 1, s: -3, h: 1, p: 1 }, 90, 3.98, 151.49, "O1"),
    c("ρ1", 1, { T: 1, s: -3, h: 3, p: -1 }, 90, 0.76, 148.09, "O1"),
    c("O1", 1, { T: 1, s: -2, h: 1 }, 90, 19.57, 160.28, "O1"),
    c("P1", 1, { T: 1, h: -1 }, 90, 8.28, 176.49, "none"),
    c("K1", 1, { T: 1, h: 1 }, -90, 25.07, 178.91, "K1"),
    c("J1", 1, { T: 1, s: 1, h: 1, p: -1 }, -90, 1.42, 188.39, "J1"),
    c("OO1", 1, { T: 1, s: 2, h: 1 }, -90, 0.79, 220.38, "OO1"),
    c("2N2", 2, { T: 2, s: -4, h: 2, p: 2 }, 0, 0.9, 158.76, "M2"),
    c("μ2", 2, { T: 2, s: -4, h: 4 }, 0, 1.33, 169.12, "M2"),
    c("N2", 2, { T: 2, s: -3, h: 2, p: 1 }, 0, 7.21, 149.92, "M2"),
    c("ν2", 2, { T: 2, s: -3, h: 4, p: -1 }, 0, 1.42, 148.5, "M2"),
    c("M2", 2, { T: 2, s: -2, h: 2 }, 0, 47.73, 153.73, "M2"),
    c("L2", 2, { T: 2, s: -1, h: 2, p: -1 }, 180, 1.66, 161.73, "M2"),
    c("T2", 2, { T: 2, h: -1, p1: 1 }, 0, 1.31, 152.58, "none"),
    c("S2", 2, { T: 2 }, 0, 23.64, 181.77, "none"),
    c("K2", 2, { T: 2, h: 2 }, 0, 6.48, 177.31, "K2"),
    c("M3", 3, { T: 3, s: -3, h: 3 }, 0, 1.13, 153.94, "M3"),
    c("M4", 4, { T: 4, s: -4, h: 4 }, 0, 0.8, 185.37, "M4"),
    c("MS4", 4, { T: 4, s: -2, h: 2 }, 0, 0.28, 270.8, "M2"),
  ],
};
