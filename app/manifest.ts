import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "말씀타자 — 성경 타자연습",
    short_name: "말씀타자",
    description: "성경 66권을 따라 쓰며 진도와 성취를 기록하는 개인용 타자연습 게임",
    start_url: "/",
    display: "standalone",
    background_color: "#f3f0e6",
    theme_color: "#244f42",
    lang: "ko",
    orientation: "any",
  };
}
