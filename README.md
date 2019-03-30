# Amplify Photo Gallery Workshop
AWS Amplify와 AWS AppSync를 이용하여 Photo gallery web app 구현해보는 AWS Workshop tutorial 문서입니다. 현재 한글화 작업을 하고 있습니다.

## the Workshop 보기
Workshop 문서는 아래 URL을 통하여 확인할 수 있습니다. (한글화 작업 중)  
https://awskrug.github.io/amplify-photo-gallery-workshop/ 


## Hugo로 Workshop 사이트 빌드하기

#### Hugo 설치:
On a mac:

`brew install hugo`

On Linux:
  - Download from the releases page: https://github.com/gohugoio/hugo/releases/tag/v0.37
  - Extract and save the executable to `/usr/local/bin`

#### Clone this Repository:
아래 명령어로 체크아웃하고자 하는 로컬 디렉토리에 클론하세요.   
`git clone git@github.com:awskrug/amplify-photo-gallery-workshop.git`

#### Clone the theme submodule:

```sh
cd amplify-photo-gallery-workshop
git submodule init
git submodule update --checkout --recursive
```

#### node packages 설치하기:

`npm install`

#### 로컬환경에서 Hugo 실행하기:

`npm run server`
or
`npm run test` to see stubbed in draft pages.

#### 로컬환경에서 Hugo 확인하기:
http://localhost:1313/ 로 접속하여 빌드된 Workshop site를 확인합니다.

#### 수정사항 확인하기:
페이지를 수정한 후 저장하면, Site가 수정사항을 반영하여 화면을 리로딩 합니다.

note: shift-reload may be necessary in your browser to reflect the latest changes.

## License Summary

해당 Sample code는 수정된 MIT 라이센스의 영향 아래 사용 가능합니다.


