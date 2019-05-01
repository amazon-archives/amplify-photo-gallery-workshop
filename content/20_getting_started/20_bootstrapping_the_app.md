+++
title = "앱 부트스트래핑"
chapter = false
weight = 20
+++

### 리액트(React) 앱 만들기
**create-react-app** CLI로 새로운 리액트 웹 앱을 제작하며 시작하겠습니다.

{{% notice info %}}
이는 로컬에서 자동으로 다시 서버를 띄워주는 리액트 샘플 앱과 브라우저에서 async/await 문법, 화살표 함수 등을 지원하도록 트랜스 컴파일 기능을 제공합니다.
{{% /notice %}}

{{% notice tip %}}
create-react-app은 [https://github.com/facebook/create-react-app](https://github.com/facebook/create-react-app)에서 좀 더 배울 수 있습니다.
{{% /notice %}}

**Cloud9 터미널에서** `npx create-react-app photo-albums`를 실행하시고 새로 생성된 디렉토리로 이동합니다 `cd photo-albums`

> 이 명령어를 통해 photo-albums라는 이름을 가진 amplify 앱의 기본 구조를 생성합니다.

### 시멘틱 UI 리액트 추가하기

UI를 작성하기 전에 인터페이스를 좀 더 근사하게 만들수 있는 리액트의 시멘틱 UI 컴포넌트를 추가합니다.

**photo-albums 디렉터리에서** `npm install --save semantic-ui-react` 실행합니다.

그리고 **public/index.html**를 수정하고 이 스타일 시트 링크를 추가합니다.

```html
<head>
    <!-- ... --> 

    <link rel="stylesheet" href="//cdnjs.cloudflare.com/ajax/libs/semantic-ui/2.3.3/semantic.min.css"></link>

    <!-- ... --> 
</head>
```

### 앱 띄워 보기
이제 개발 서버에서 시작해서 수정하면 브라우저에서 즉각 새로고침하여 볼 수 있게 합니다.

**photo-albums 디렉터리에서** `npm start`를 실행합니다.

웹 서버를 시작했으면 **Preview** 메뉴를 클릭하고 **Preview Running Application**을 선택합니다.

![preview running application](/images/preview_running_application.png)

원하시면 **미리보기를 새 창에 표시**할 수 있습니다.

![pop app to new window](/images/pop_browser_new_window.png)

마지막으로 **다른 터미널 윈도우를 엽니다**. 첫번째 터미널은 웹 서버 프로세스를 실행 중이므로 남겨둡니다.
![new terminal](/images/c9_new_terminal.png)

### 마크업 단순화하기

다음으로 깨끗한 상태로 시작하고 싶습니다.

**src/App.js를 수정**하여 간단히 'Hellow World' 메시지를 보여주도록 바꿉니다. **파일의 기존 내용을 아래와 같이 변경합니다**.

```jsx
// src/App.js

import React, { Component } from 'react';
import { Header } from 'semantic-ui-react';

class App extends Component { 
    render() { 
        return (
            <div>
                <Header as='h1'>Hello World!</Header>
            </div>
        );
    }
}

export default App;
```

{{% notice note %}}
이 시점에서 이전에 띄워둔 브라우저는 자동으로 새로고침되고 'Hello World'라는 텍스트만 있는 훨씬 간단한 페이지가 표시할 것입니다. 아직 못 보았지만 최소한의 마크업으로 시작하는 것이 좋습니다.
{{% /notice %}}