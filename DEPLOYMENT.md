# 배포 가이드

## rofan.world v1.2.1 배포

### 주요 변경사항
- 프롬프트 규칙 개선 (캐릭터 누락 방지, 신규 인물 포함 규칙 강화)
- 모델 변경: gpt-4o-mini → gpt-4o (분석 정확도 향상)
- CHARACTER & WORLD BIBLE 통합 (캐릭터 설정 + 세계관 설명)
- 장면 전환 시 캐릭터 정리 규칙 추가
- 캐릭터 제한 완화 (최대 3명 → 2~8명 권장)

### 배포 단계

1. **빌드 확인**
   ```bash
   npm run build
   ```

2. **프로덕션 서버 테스트**
   ```bash
   npm start
   ```

3. **배포**
   - Vercel 또는 호스팅 플랫폼에 배포
   - 환경변수 확인 (OPENAI_API_KEY)

4. **버전 태그 생성**
   ```bash
   git tag v1.2.1
   git push origin v1.2.1
   ```

5. **GitHub Release 생성**
   - 태그: v1.2.1
   - 제목: rofan.world v1.2.1
   - 설명: 프롬프트 개선 및 모델 업그레이드

