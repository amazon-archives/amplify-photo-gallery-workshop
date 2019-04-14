# Amplify Photo Gallery Workshop

[![Build Status](https://api.travis-ci.org/awskrug/amplify-photo-gallery-workshop.svg?branch=master)](https://travis-ci.org/awskrug/amplify-photo-gallery-workshop)
[![GitHub release](https://img.shields.io/github/release/awskrug/amplify-photo-gallery-workshop.svg)](https://github.com/awskrug/amplify-photo-gallery-workshop/releases/latest)

AWS Amplify와 AWS AppSync를 이용하여 사진 앨범 웹앱을 구현해보는 AWS 워크샵 튜토리얼 문서입니다. 

## Workshop 문서 웹페이지 확인하기
Workshop 문서는 아래 URL을 통하여 확인할 수 있습니다. (한글화 작업 중)  
https://awskrug.github.io/amplify-photo-gallery-workshop/ 


## 로컬환경에서 Hugo를 이용해서 워크샵 사이트 빌드하기

#### Hugo 설치:

맥에서는:

`brew install hugo`

리눅스에서는:
  - [Hugo 릴리즈 페이지](https://github.com/gohugoio/hugo/releases/tag/v0.53)에서 사용하는 배포판에 맞는 tar.gz 형식의 파일을 받습니다.
  - 풀어서 hugo 파일을 `/usr/local/bin` 에 복사합니다.

윈도우에서는:
  - [Hugo 릴리즈 페이지](https://github.com/gohugoio/hugo/releases/tag/v0.53)에서 사용하는 윈도우에 맞는 파일을 받습니다.
  - 압축 파일을 풀고, 해당 경로를 PATH에 추가합니다.

이외에 자세한 사항은 [Hugo 설치 페이지](https://gohugo.io/getting-started/installing/)를 참고하세요.

#### 리포지터리 클로닝:
개인 리포지터리로 하고 아래와 유사하게 포크한 개인 리포지터리 주소로 작업할 로컬 디렉토리에 클론하세요.   
`git clone https://github.com/[본인깃헙계정]/amplify-photo-gallery-workshop.git`

#### 서브 모듈 갱신:
클론한 로컬 디렉토리에서 서브 모듈을 갱신합니다.

```sh
cd amplify-photo-gallery-workshop
git submodule init
git submodule update --checkout --recursive
```
#### 번역하기

[튜토리얼 한글화 작업 가이드](https://github.com/awskrug/amplify-photo-gallery-workshop/wiki/%ED%8A%9C%ED%86%A0%EB%A6%AC%EC%96%BC-%ED%95%9C%EA%B8%80%ED%99%94-%EC%9E%91%EC%97%85-%EA%B0%80%EC%9D%B4%EB%93%9C)를 따릅니다.

#### 로컬환경에서 Hugo 실행:
앞서 설치한 hugo를 이용하여 다음을 실행하면 로컬환경에서 번역한 내용을 확인해 볼 수 있습니다.
`hugo server`

#### 로컬환경에서 Hugo 확인하기:
http://localhost:1313/amplify-photo-gallery-workshop/ 로 접속하여 빌드한 워크샵 사이트를 확인합니다.

#### 수정사항 확인하기:
페이지 파일(.md 파일)을 수정 후 저장하면, 즉시 반영되고 화면도 자동으로 갱신됩니다.

## License Summary

해당 Sample code는 수정된 MIT 라이센스의 영향 아래 사용 가능합니다.


