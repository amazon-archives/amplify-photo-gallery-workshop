+++
title = "S3에 어플리케이션 배포하기"
chapter = false
weight = 120
+++

우리가 어플리케이션을 구축 및 배포하기 전에, 우리는 Cloud9 인스턴스의 일부 메모리를 사용할 수 있도록 해야합니다. 만약 여러분께서 Cloud9 인스턴스 타입을 micro를 사용한다면 개발 웹서버 구동을 지속하고 프로덕션을 구축할 수 있는 충분한 메모리가 없기때문에 여기 좋은 기회입니다.

1. **개발 웹서버**를 구동하고 있는 **터미널** 탭으로 이동합니다. (*npm start*를 실행했던 터미널입니다)

2. 개발 웹서버를 중단하고 프로세스를 죽일 수 있도록 **Control-C** 단축키를 누릅니다.

AWS Amplify CLI는 우리의 어플리케이션을 공개적으로 접근가능한 S3 버킷으로 배포하는 것을 쉽게 만들어줍니다.

1. `amplify hosting add`를 **실행**하고 배포 모드(이번 워크샵에서는 'Development'를 선택합니다)를 선택하여 질문들에 응답(index와 오류 문서를 위해 index.html를 기본값으로 설정) 합니다.

    ```bash
    $ amplify hosting add

    ? Select the environment setup: 

    DEV (S3 only with HTTP)


    ? hosting bucket name 

    photoalbums-19700101010203--hostingbucket


    ? index doc for the website 

    index.html


    ? error doc for the website 

    index.html
    ```


2. `amplify push`를 **실행**합니다.

3. 정적 컨텐츠가 생성되는 어플리케이션을 제공할 새로운 S3 버킷이 생성될 때까지 기다립니다. 이 작업은 보통 1분정도가 소요됩니다.

4. `amplify publish`를 **실행**합니다.

5. Amplify가 프로덕션 버전의 어플리케이션을 구축하고 호스팅 버킷으로 배포하는동안 기다립니다. 이 작업은 보통 1-2분정도가 소요됩니다.

구축 및 배포가 완료되고나서, 여러분은 배포된 어플리케이션의 URL을 보실 수 있습니다. 언제든 여러분이 새로 구축된 어플리케이션을 호스팅하려면 `amplify publish`명령어만 재실행하여 언제든지 새로 변경된 어플리케이션을 생성할 수 있습니다.

