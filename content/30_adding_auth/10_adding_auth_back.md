+++
title = "백엔드 구성하기"
chapter = false
weight = 10
+++

이제 우리에게 간단한 리액트 앱이 있으니, 앱으로 사용자 등록하고 로그인하도록 만들겠습니다. 지금 아무 것도 할 수 없지만 백엔드 API에 조회하는 기능을 추가하면 어떤 사용자가 우리 시스템을 사용하는지 알 수 있습니다.

{{% notice info %}}
AWS Amplify CLI는 리엑트와 리엑트 네이티브용 iOS와 안드로이드에 SDK를 제공하여 웹과 모바일 앱에 클라우드 기능을 손쉽게 추가할 수 있습니다. 시작을 위해 새 애플리케이션을 만들고 사용자 인증을 가능토록 합니다. 앱에 AWS Amplify CLI로 구성하여 앱과 오픈소스 [AWS Amplify](https://aws-amplify.github.io/) 라이브러리를 연결합니다. 이제 해야 할 것은 리액트 앱에서 이것을  사용하면 됩니다. AWS Amplify는 클라우드 서비스에서 동작하는 괜찮은 추상화와 앱에서 사용할 유용한 리액트 컴포넌트를 포함합니다.
{{% /notice %}}

로그인 화면은 다음과 같습니다.
![Here's what the sign-in screen looks like](/images/app-signin-screen.png?classes=border)

### Amplify 초기화

** 커맨드라인으로 photo-albums 디렉터리에서**:

1. **photo-albums 디렉터리로 들어갑니다.** `cd photo-albums`

1. `amplify init`를 **실행합니다.**

1. 'photo-albums'을 기본 프로젝트명으로 하기 위해 **_Enter_를 누르십시요.**

1. environment name은 **'dev'를 입력합니다.**

1. default editor(우리는 Cloud9을 씁니다)로 **'None' 선택하십시요.**

1. 프롬프트가 나오면 **JavaScript와 React를 선택하십시요.**

1. 경로와 명령어에는 **기본값을 선택합니다.**

1. 프롬프트가 나오면 **default 프로파일을 선택하십시요.**

![amplify init](/images/amplify_init.png)

{{% notice info %}}
이렇게 하면 [Amazon Cognito](https://aws.amazon.com/cognito/) 유저 풀을 구성하여 사용자가 가입하고 로그인을 위한 백엔드 역할을 할 수 있는 새 로컬 구성을 생성합니다(Amazon Cognito와 유저 풀에 대한 자세한 내용은 아래에 있습니다). 이 단계를 더 자세히 아시려면 [AWS Amplify 인증 가이드](https://aws-amplify.github.io/amplify-js/media/authentication_guide.html)에서 'Installation and Configuration' 항목을 살펴보십시요.
{{% /notice %}}

### 인증 추가하기

1. 인증을 추가하기 위해 `amplify add auth`를 **실행합니다.**

1. 기본 인증 및 보안 구성을 사용할지 질문에는 **Yes를 선택합니다.**

1. 클라우드에 변경 사항을 반영하기 위해 `amplify push`를 **실행합니다.**

1. 프로비저닝이 완료될 때까지 기다립니다. 몇 분이 소요됩니다.

{{% notice info %}}
Amplify CLI는 적절한 클라우드 리소스로 프로비저닝하고 src/aws-exports.js 파일을 앱에서 사용하는 클라우드 리소스의 모든 구성 데이터로 갱신합니다.
{{% /notice %}}

축하합니다! 바로 방금 귀하는 Amazon Cognito로 수백만 사용자까지 확장할 수 있는 사용자 등록과 권한 부여를 위한 서버리스 백엔드를 만들었습니다.

{{% notice tip %}}
Amazon Cognito를 사용하면 웹과 모바일 애플리케이션에 사용자 등록, 로그인, 접근제어 기능을 쉽고 빠르게 추가할 수 있습니다. 방금 생성한 유저 풀은 보안된 사용자 디렉터리로 이를 이용하여 사용자가 생성한 사용자명과 암호로 로그인할 수 있습니다. Amazon Cognito(Amplify CLI 함께)는 또한 Facebook, Google, Amazon 같은 소셜 인증 공급자와 SAML 2.0을 통한 엔터프라이즈 인증 공급자를 이용한 로그인 구성도 지원합니다. 자세한 내용을 알기 원하시면 [Amazon Cognito Developer Resources page](https://aws.amazon.com/cognito/dev-resources/)와 [AWS Amplify Authentication documentation.](https://aws-amplify.github.io/amplify-js/media/authentication_guide#federated-identities-social-sign-in)를 살펴보십시요.
{{% /notice %}}