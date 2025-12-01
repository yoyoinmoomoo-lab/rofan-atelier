import { redirect } from "next/navigation";

/**
 * 캐릭터 이름 생성기 페이지 리다이렉트
 * 
 * 기존 /character 링크를 /?tab=character로 리다이렉트합니다.
 * lang 쿼리가 있으면 그대로 전달합니다.
 */
export default function CharacterPage({
  searchParams,
}: {
  searchParams: { lang?: string };
}) {
  const langParam = searchParams.lang ? `&lang=${searchParams.lang}` : "";
  redirect(`/?tab=character${langParam}`);
}

