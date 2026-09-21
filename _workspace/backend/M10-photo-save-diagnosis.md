# M10 사진 저장 실패 진단

## 조사 시각

2026-09-20

## 확인한 실행 상태

- 로컬 백엔드는 `:8080`에서 실행 중이며 작업 디렉터리는 `backend`다.
- 백엔드는 `backend/.env`를 읽고, 저장소 선택값은 `APP_STORAGE_TYPE=s3`다.
- S3 리전과 버킷 값도 설정돼 있다. 로컬 파일 저장소는 현재 선택되지 않는다.
- 실행 Java의 `user.home`은 `C:\Users\kyo`이며, 기본 AWS 자격 증명 탐색 경로인 `C:\Users\kyo\.aws\credentials`가 존재한다.

## 확정 원인

WSL에서 같은 기본 AWS 자격 증명으로 실행한 읽기 전용 신원 확인이 실패했다.

```text
aws sts get-caller-identity
InvalidClientTokenId: The security token included in the request is invalid.
```

애플리케이션의 `S3Client`는 명시 키가 아니라 AWS SDK 기본 자격 증명 공급자를 사용한다. 따라서 사진 저장 시 `S3FileStorage.store()`의 `PutObject`가 유효하지 않은 자격 증명으로 실패하고, `UserPhotoUploadService`가 이를 일반적인 사진 저장 실패로 변환한다.

## 배제한 항목

- 백엔드 미기동: 아님. 8080 포트에서 현재 실행 중이다.
- DB/Flyway 미적용: 아님. 애플리케이션은 기동돼 요청을 받을 수 있다.
- 로컬 디렉터리 권한: 현재 저장 경로가 local이 아니라 S3라 직접 원인이 아니다.
- multipart 용량: 최대 파일 10MB, 요청 32MB 설정은 존재하지만 이번 진단의 자격 증명 오류와 무관하다.

## 최소 해결 조치

1. AWS IAM 콘솔에서 현재 액세스 키가 활성 상태인지 확인한다. 비활성화·삭제·재발급된 키면 새 액세스 키를 만든다.
2. `C:\Users\kyo\.aws\credentials`의 기본 프로필(`default`)을 새 키로 갱신한다. 앱은 `AWS_PROFILE`을 지정하지 않아 기본 프로필을 사용한다.
3. PowerShell에서 AWS CLI를 설치하거나, WSL에서 `aws sts get-caller-identity`가 성공하는지 다시 확인한다. 성공 뒤 백엔드를 재시작한다.
4. S3 쓰기 권한(`s3:PutObject`)은 기존 버킷의 `uploads/*` 경로에 유지돼야 한다.

시크릿 값·버킷 실명은 이 기록에 남기지 않았다.
