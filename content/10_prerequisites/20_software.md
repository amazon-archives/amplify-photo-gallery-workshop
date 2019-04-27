+++
title = "설치 & 설정"
chapter = false
weight = 20
+++

코딩을 시작하기 전에, Cloud9 환경에 몇 가지 설치, 업데이트, 설정을 해야합니다.

### 설치와 업데이트

Cloud9 터미널에서 **다음 명령어를 수행하세요.**  우리가 사용할 몇 가지 소프트웨어를 설치하고 업데이트 합니다.

```bash
# Update the AWS CLI
pip install --user --upgrade awscli

# Install and use Node.js v8.10 (to match AWS Lambda)
nvm install v8.11.0
nvm alias default v8.11.0

# Install the AWS Amplify CLI
npm install -g @aws-amplify/cli
```

{{% notice note %}}
이 명령어들은 완료 되는데 시간이 좀 걸릴수 있습니다. (few minutes)
{{% /notice %}}

### 기본 region 설정하기  

가장 좋은 방법은 인프라를 고객과 가까운 지역에 구성하는 것입니다. (Amplify는 서울 리전도 지원합니다.)    
이번 워크샵에서는 기본 AWS region을 다음 지역으로 설정합니다:    
-  한국 - Seoul (*ap-northeast-2*)  
-  미국 - Northern Virginia (*us-east-1*)  
-  유럽 - Ireland (*eu-west-1*) 

**AWS config file 생성하기**, 실행:

{{% tabs %}}
{{% tab "ap-northeast-2" "Seoul" %}}
```bash
cat <<END > ~/.aws/config
[default]
region=ap-northeast-2
END
```
{{% /tab %}}

{{% tab "us-east-1" "North America" %}}
```bash
cat <<END > ~/.aws/config
[default]
region=us-east-1
END
```
{{% /tab %}}

{{% tab  "eu-west-1"  "Europe" %}}
```bash
cat <<END > ~/.aws/config
[default]
region=eu-west-1
END
```
{{% /tab %}}
{{% /tabs %}}

{{% notice info %}}
AWS Amplify CLI는 모바일과 웹 어플리케이션을 개발을 심플하게 해주는 강력한 기능들을 제공하는 툴체인 입니다. 위의 단계에서는 설치만 진행했기 때문에 설정 단계가 추가적으로 필요합니다. 
AWS Amplify CLI는 **~/.aws/config**을 찾아 작업할 Region 정보를 판별합니다.
Cloud9은 유효한 Administrator credentials이 **~/.aws/credentials** 파일안에 있는지 확인만 할 뿐 **~/.aws/config**을 생성하지 않습니다.
{{% /notice %}}