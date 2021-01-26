import React, { useEffect, useState } from 'react';
import { db, auth, storage } from './firebase';
import Video from './Video'
import tiktok from './tiktok.jpg'
import './App.css';
import { AccountCircle, CameraAltOutlined, Favorite, Lock, Publish } from '@material-ui/icons';
import { Avatar, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Fab, Input, Link, makeStyles, Modal, Popover, TextField } from '@material-ui/core';
import Dropzone from 'react-dropzone-uploader';

function getModalStyle() {
  const top = 50;
  const left = 50;

  return {
    top: `${top}%`,
    left: `${left}%`,
    transform: `translate(-${top}%, -${left}%)`,
  };
}

const useStyles = makeStyles((theme) => ({
  paper: {
    position: 'absolute',
    width: 300,
    backgroundColor: theme.palette.background.paper,
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  small: {
    width: theme.spacing(3),
    height: theme.spacing(3),
  },
  large: {
    width: theme.spacing(7),
    height: theme.spacing(7),
    marginLeft: 10,
  },
}));

function App() {
  const [videos, setVideos] = useState([])
  const [playing, setPlaying] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [image, setImage] = useState(null)
  const [user, setUser] = useState(null)
  const [userImageUrl, setUserImageUrl] = useState(null)
  const [openSignIn, setOpenSignIn] = useState(false)
  const [disableBackdropClick, setDisableBackdropClick] = useState(false)
  const [disableEscapeKeyDown, setDisableEscapeKeyDown] = useState(false)
  const [openSignUp, setOpenSignUp] = useState(false)
  const [userAvatarMenuOpen, setUserAvatarMenuOpen] = useState(false);
  const [openVideoUploadBox, setOpenVideoUploadBox] = useState(false)

  let fileInput = React.createRef()
  const userAvatarRef = React.useRef('')

  const classes = useStyles()
  const [modalStyle] = React.useState(getModalStyle)


  useEffect(() => {
    // setUserAvatarMenuOpen(false)
    const unsubscribe = auth.onAuthStateChanged((authUser) => {
      if (authUser) {
        //user has logged in
        setUser(authUser)
      } else {
        //user has logged out
        setUser(null);
      }
    })

    return () => {
      //perform some cleanup functions before refiring the useEffect.
      unsubscribe();
    }
  }, [user])

  useEffect(() => {
    db.collection('videos').onSnapshot(snapshot =>
      setVideos(snapshot.docs.map(doc => ({ id: doc.id, video: doc.data() })))
    )
  }, [])

  const onVideoPress = (videoRef) => {
    if (playing) {
      videoRef.target.pause();
      setPlaying(false)
    } else {
      videoRef.target.play();
      setPlaying(true)
    }
  }

  const onScrollPauseVideo = () => {
    setPlaying(false)
  }

  // signUp
  const signUp = (event) => {
    event.preventDefault();

    setDisableBackdropClick(true)
    setDisableEscapeKeyDown(true)

    auth.createUserWithEmailAndPassword(email, password)
      .then((authUser) => {
        //upload user profile photo
        if (image !== null) {
          const uploadTask = storage.ref(`usersphoto/${authUser.user.uid}/${image.name}`).put(image);
          uploadTask.on(
            "state_changed",
            (snapshot) => {
              //progress function
            },
            (error) => {
              console.log(error)
              alert(error.message)
            },
            () => {
              //completes the funciton
              let nameStr;
              let nameMatch;
              let username;
              //get url of the uploaded file
              storage
                .ref(`usersphoto/${authUser.user.uid}`)
                .child(image.name)
                .getDownloadURL()
                .then(url => {
                  setUserImageUrl(url)
                })
                .then(
                  alert('sign up completed.')
                )
                .then(
                  // extract username from emailId provided
                  nameStr = email,
                  nameMatch = nameStr.match(/^([^@]*)@/),
                  username = nameMatch ? nameMatch[1] : null,

                  authUser.user.updateProfile({
                    displayName: username,
                    photoURL: userImageUrl
                  }),

                  setEmail(''),
                  setPassword(''),
                  setImage(null),
                  setDisableBackdropClick(false),
                  setDisableEscapeKeyDown(false),
                )
            },
          )
        }
      })
      .catch((error) => alert(error.message))
  }

  //signIn
  const signIn = (event) => {
    event.preventDefault();

    setDisableBackdropClick(true)
    setDisableEscapeKeyDown(true)

    auth.signInWithEmailAndPassword(email, password)
      .catch((error) => alert(error.message))
      .then(
        console.log(user, 'logged in successfully'),
        setOpenSignIn(false),
        setEmail(''),
        setPassword(''),
        setDisableBackdropClick(false),
        setDisableEscapeKeyDown(false),
      )
  }

  const openSignUpModal = () => {
    setOpenSignIn(false)
    setOpenSignUp(true)
  }

  const handleFileChange = (e) => {
    if (e.target.files[0]) {
      setImage(e.target.files[0])
    }
  }

  const handleUserAvatarMenuClick = () => {
    setUserAvatarMenuOpen(true)
  };

  const handleUserAvatarMenuClose = () => {
    setUserAvatarMenuOpen(false)
  };

  const handleCloseVideoUploadBox = () => {
    setOpenVideoUploadBox(false)
  }

  const getUploadParams = () => {
    return { url: 'https://httpbin.org/post' }
  }

  const handleChangeStatus = ({ meta }, status) => {
    console.log(status, meta)
  }

  const handleSubmit = (files, allFiles) => {
    console.log(files.map(f => f.meta))
    allFiles.forEach(f => f.remove())
  }

  return (
    <div className="app">
      <span className="app__copywrite">
        developed with&nbsp;
        <Favorite fontSize="small" className="app__favoriteIcon" />
        <Link target="_blank" href="https://www.facebook.com/hasibahmadkhaliqi">&nbsp;by hak</Link>
      </span>
      <img className="app__backgroundImage" src={tiktok} alt="Noooo" />
      <div className="app__backgroundColor"></div>

      {/* SignIn Button */}
      <span className="app__signInButton">
        {user ? (
          <div className="app__signedUser">
            <Fab className="app__videoUploadButton" title="upload video" color="primary" onClick={() => { setOpenVideoUploadBox(true) }}>
              <Publish className="app__videoUploadButton" />
            </Fab>

            {/* Video Upload DialogBox */}
            <Dialog open={openVideoUploadBox} onClose={handleCloseVideoUploadBox}>
              <DialogTitle id="form-dialog-title">Upload your video</DialogTitle>
              <DialogContent>
                <DialogContentText>
                  Add a video to post on your Feed
                  <TextField
                    margin="dense"
                    id="name"
                    label="Channel"
                    value={user?.displayName}
                    disabled
                    fullWidth
                  />
                  <TextField
                    autoFocus
                    margin="dense"
                    id="description"
                    label="Description"
                    fullWidth
                  />
                  <TextField
                    margin="dense"
                    id="song"
                    label="Enter the lyrics of the song"
                    fullWidth
                  />
                  <TextField
                    margin="dense"
                    id="url"
                    label="URL"
                    fullWidth
                  />

                </DialogContentText>
                  {/* upload video box */}
                  <Dropzone
                    getUploadParams={getUploadParams}
                    onChangeStatus={handleChangeStatus}
                    onSubmit={handleSubmit}
                    styles={{ dropzone: { minHeight: 200, maxHeight: 250 } }}
                  />
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseVideoUploadBox} color="primary">
                  Cancel
                </Button>
                <Button onClick={handleCloseVideoUploadBox} color="primary">
                  Subscribe
                </Button>
              </DialogActions>
            </Dialog>

            <Avatar
              className={classes.large}
              alt='username'
              title={user?.displayName}
              ref={userAvatarRef}
              src={user?.photoURL}
              onClick={handleUserAvatarMenuClick}
            />

            <Popover
              open={userAvatarMenuOpen}
              anchorEl={userAvatarRef.current}
              onClose={handleUserAvatarMenuClose}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'center',
              }}
              transformOrigin={{
                vertical: 'top',
                horizontal: 'center',
              }}
            >
              {/* eslint-disable-next-line */}
              <Button variant="outlined" color="primary" onClick={() => (auth.signOut(), setUserAvatarMenuOpen(false))} >
                <Lock className="app__userAvatarIcons" fontSize="small" />
                  &nbsp;&nbsp;Logout
              </Button>
            </Popover>
          </div>
        ) : (
            <Button
              variant="outlined"
              color="primary"
              startIcon={<AccountCircle />}
              onClick={() => { setOpenSignIn(true) }}
              size="large"
            >
              sign in
            </Button>
          )}
      </span>

      {/* signIn Card */}
      <Modal
        open={openSignIn}
        onClose={() => { setOpenSignIn(false) }}
        disableBackdropClick={disableBackdropClick}
        disableEscapeKeyDown={disableEscapeKeyDown}
      >
        <div style={modalStyle} className={classes.paper}>
          <form className="app__signup">
            <center>
              <img
                className="app__headerImage"
                src="https://logos-world.net/wp-content/uploads/2020/04/TikTok-Emblema.png"
                alt="tik-tok logo"
                width="40%"
              />
            </center>
            <Input
              className="app__signInFeilds"
              placeholder="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              className="app__signInFeilds"
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <Button className="app__signInFeilds" variant="outlined" color="primary" type="submit" onClick={signIn}>Sign In</Button>
            <Link
              className="app__signUpLink"
              variant="body2"
              onClick={openSignUpModal}
            >
              Don't have an account? Sign up here
            </Link>
          </form>
        </div>
      </Modal>

      {/* signUp Card */}
      <Modal
        open={openSignUp}
        onClose={() => { setOpenSignUp(false) }}
        disableBackdropClick={disableBackdropClick}
        disableEscapeKeyDown={disableEscapeKeyDown}
      >
        <div style={modalStyle} className={classes.paper}>
          <form className="app__signup">
            <center>
              <img
                className="app__headerImage"
                src="https://logos-world.net/wp-content/uploads/2020/04/TikTok-Emblema.png"
                alt="tik-tok logo"
                width="40%"
              />
            </center>
            <Input
              className="app__signInFeilds"
              placeholder="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              className="app__signInFeilds"
              placeholder="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="app__signInFeilds">
              <input className="app__fileInput" name="fileInput" ref={fileInput} type="file" onChange={handleFileChange} />
              <Button startIcon={<CameraAltOutlined />} variant="outlined" color="secondary" className="app__fileInputButton" onClick={() => { fileInput.current.click() }}>Upload profile photo</Button>
            </div>
            <Button className="app__signInFeilds" variant="outlined" color="primary" type="submit" onClick={signUp}>Sign Up</Button>
          </form>
        </div>
      </Modal>

      {/* Display videos */}
      <div className="app__videos" onScroll={onScrollPauseVideo}>
        {videos.map(
          (({ id, video }) => (
            <Video
              key={id}
              videoId={id}
              url={video.url}
              channel={video.channel}
              description={video.description}
              song={video.song}
              likes={video.likes}
              messages={video.messages}
              shares={video.shares}
              onVideoPress={onVideoPress}
              playing={playing}
              user={user}
            />
          ))
        )}
      </div>
    </div>
  );
}

export default App;
