+++
title = "Cloud9 Workspace 생성하기"
chapter = false
weight = 10
+++

AWS Cloud9은 cloud-based의 통합 개발 환경(IDE)입니다. 브라우저에서 바로 코드를 작성하고 실행시키고, 디버깅할수 있습니다. 
Cloud9은 코드 편집기, 디버거와 터미널을 제공합니다. 또한 Javascript, Python, PHP 등의 인기 있는 프로그래밍언어를 위한 필수적인 도구들이 미리 패키징 되어 제공됩니다. 무엇보다도 새로운 프로젝트 시작을 위해 설치 파일이 필요하거나, 개발 환경 설정이 필요하지 않습니다.


{{% notice warning %}}
The Cloud9의 작업영역은 AWS root 계정이 아닌, Administrator 권한을 가진 IAM user에 의해서 작성 되어야 합니다. root 계정이 아닌 IAM User로 로그인 하여 작업 중인게 맞는지 꼭 확인하세요.
{{% /notice %}}

{{% notice info %}}
광고 차단기, Javascript 비활성화 도구 및 차단 추적기 등은 Cloud9 에서는 비활성화 하세요. 작업 영역에 영향을 줄 수 있습니다.
{{% /notice %}}

### 새 환경 만들기

1. 이 실습은 버지니아 리전(us-east-1)에서 실행됩니다.
1. [Cloud9 web console](https://us-east-1.console.aws.amazon.com/cloud9/home?region=us-east-1) 로 이동
1. **Create environment** 선택
1. **workshop**으로 이름을 붙이고 **Next step**으로 넘어가세요.
1. **Create a new instance for environment (EC2)** 선택하고 **t2.micro**를 고르세요
2. 모든 환경 설정을 있는 그대로 두고 **Next step**로 이동합니다.
3. **Create environment**를 클릭합니다.

### Layout 정리

작업 환경이 나타나면, 레이아웃을 본인에게 맞게 커스터마이징 합니다.  1) **welcome tab**을 닫고 2) **아래 작업 영역도 닫습니다.** 3)새로운 **terminal** 탭을 메인 작업 영역에 띄웁니다.  :
![c9before](/images/c9before.png)

당신의 작업 영역은 이제 이렇게 보일거에요.:
![c9after](/images/c9after.png)

Cloud9 workspace 메뉴에서 **View / Themes / Solarized / Solarized Dark** 테마를 직접 선택할 수 있습니다.
