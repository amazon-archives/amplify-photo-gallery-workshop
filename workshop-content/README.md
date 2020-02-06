# Attention

This workshop content is over a year old and AWS Amplify has made a great deal of improvements 
since this content was originally written. 

Instead of this content, please check out some of the more up-to-date Amplify content. One great 
example is the <a href="https://github.com/aws-samples/aws-serverless-airline-booking">AWS Serverless Airline Booking</a> project. 
Besides that, you can find lots more excellent AWS Amplify content on the <a href="https://amplify.aws/community/">AWS Amplify Community</a> site.

If you would still like to review the content of this workshop, these instructions should still work, 
provided you use the specific version of AWS Amplify noted in the Prerequisites section.

------------

# Amplify Photo Gallery Workshop
AWS Workshop tutorial for building a photo gallery web app using AWS Amplify and AWS AppSync.

## Building the workshop static site with Hugo

#### Install Hugo:
On a mac:

`brew install hugo`

On Linux:
  - Download from the releases page: https://github.com/gohugoio/hugo/releases/tag/v0.37
  - Extract and save the executable to `/usr/local/bin`

#### Clone this repo:
From wherever you checkout repos:
`git clone git@github.com:aws-samples/amplify-photo-gallery-workshop.git`

#### Clone the theme submodule:

```sh
cd amplify-photo-gallery-workshop
git submodule init
git submodule update --checkout --recursive
```

#### Install node packages:

`npm install`

#### Run Hugo locally:

`npm run server`
or
`npm run test` to see stubbed in draft pages.

#### View Hugo locally:
Visit http://localhost:1313/ to see the site.

#### Making Edits:
As you save edits to a page, the site will live-reload to show your changes.

note: shift-reload may be necessary in your browser to reflect the latest changes.

## License Summary

This sample code is made available under a modified MIT license. See the LICENSE file.

