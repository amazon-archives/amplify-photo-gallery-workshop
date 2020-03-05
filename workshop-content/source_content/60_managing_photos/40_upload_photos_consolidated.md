+++
title = "Managing Photos"
chapter = false
weight = 40
+++

Now that we have an S3 bucket where our photos can get stored, we'll want to create a UI that lets us upload photos to that bucket for storage. We'll also need to track that the photo was intended to be part of a specific album that it was uploaded to, so that we can eventually load all of the photos that belong to that album.

Let's create a new _S3ImageUpload_ component that will contain an HTML file input element which will fire off an event handler when a user selects a photo. 

{{% notice info %}}
Our upload event handler will need to upload the file to S3 with some metadata annotating which album it's destined for. Luckily, the [Amplify JS Storage module](https://aws-amplify.github.io/amplify-js/media/storage_guide) makes uploading files to S3 very easy. Also, we'll need to introduce one new dependency to our app — a way to generate UUIDs — because we'll need to ensure that we're uploading files to S3 with unique names (if we used the filenames from users' devices, they could conflict).
{{% /notice %}}
 
**➡️ From the photoalbums directory, run** `npm install --save uuid @aws-amplify/storage`

Now we'll update our app by adding some imports, creating an S3ImageUpload component, and including the S3ImageUpload component in the AlbumDetails component. 
 

**➡️ Replace `src/App.js` with** ___CLIPBOARD_BUTTON afdc9f598ebf84023a317f7cc81a5933f566e39e:photoalbums/src/App.js|

### What we changed in src/App.js
- Imported v4 as uuid from *uuid*

- Imported *Divider* and *Form* from *semantic-ui-react*

- Imported *Storage* from *aws-amplify*

- Imported *S3Image* from *aws-amplify-react*

- Created new components: *S3ImageUpload* and *PhotosList*

- Updated *AlbumDetails* to support paginating photos

- Added *PhotosList* to *AlbumDetails*'s render output

### Try uploading a photo in an album

At this point there's not much to look at. **You won't be able to see any uploaded photos yet**, but you should be able to click the button, select a file, and see it change to *'Uploading…'* before switching back to an upload button again. 

{{% notice tip %}}
You can also go manually explore the S3 bucket in the AWS web console to see that the files are getting uploaded. The easiest way to find the bucket name is to look at _src/aws-exports.js_ and find the value configured for __aws_user_files_s3_bucket__. Find your bucket in the S3 web console, then look in the bucket under _public/uploads_.
{{% /notice %}}
 
{{% notice info %}}
There are a few things worth calling out in our new _S3ImageUpload_ component. It uses AWS Amplify's _Storage.vault.put_ method to upload a private file, accessible only to the user who uploaded it, into the S3 bucket we configured for our app. In this API call, we're passing in a few extra options. 
<br/><br/>
We use a UUID for the uplaoded photo name and prefix it with 'upload/' because we'll want to automatically make thumbnails for each image. We'll accomplish this shortly by adding a trigger onto the S3 bucket that will fire off a thumbnail creation function for us each time any file is added to the _uploads/_ path of the bucket. New thumbnails will also get added to the bucket and to avoid a recursive trigger loop where each thumbnail creation then causes the function to fire again, we'll scope our trigger to only execute for files that are added with a key prefix of _uploads/_.
<br/><br/>
We pass in metadata: _{ albumid: this.props.albumId }_ because we're going to have an S3 thumbnail trigger function take care of adding the information about this photo to our data store after it finishes making the thumbnail, and that function will somehow need to know what album the photo was uploaded for. We could have put the album ID in the photo key as a prefix or suffix, for example, but the metadata approach feels more appropriate. After all, this *is* metadata about the photo, right?
{{% /notice %}}
