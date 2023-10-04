import React, { useEffect, useState } from 'react';
import { AccountCircle, CameraAltOutlined, Favorite, Lock, Publish } from '@material-ui/icons';
import { Avatar, Button, Card, CardContent, CircularProgress, Dialog, DialogActions, DialogContent, DialogTitle, Fab, Input, Link, makeStyles, Modal, Popover, TextField, Typography } from '@material-ui/core';
import { blue } from '@material-ui/core/colors';
import clsx from 'clsx';

import './App.css';
import Video from './Video'
import tiktok from './tiktok.jpg'
import { db, auth, storage } from './firebase';

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
  buttonProgress: {
    color: blue[900],
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginTop: -12,
    marginLeft: -12,
  },
  wrapper: {
    margin: theme.spacing(1),
    position: 'relative',
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
  const [description, setDescription] = useState('')
  const [songLyrics, setSongLyrics] = useState('')
  const [success, setSuccess] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  let fileInput = React.createRef()
  const userAvatarRef = React.useRef('')

  const classes = useStyles()
  const [modalStyle] = React.useState(getModalStyle)

  const buttonClassname = clsx({
    [classes.buttonSuccess]: success,
  });

  useEffect(() => {
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
    setImage(null)
    setOpenVideoUploadBox(false)
  }

  const handlePostSubmit = () => {
    setDisableBackdropClick(true)
    setDisableEscapeKeyDown(true)

    if (image !== null) {
      setSuccess(false);
      setLoading(true);
      const uploadTask = storage.ref(`videos/${user.uid}/${image.name}`).put(image);
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
          //get url of the uploaded file
          storage
            .ref(`videos/${user.uid}`)
            .child(image.name)
            .getDownloadURL()
            .then(url => {
              db.collection("videos")
                .add({
                  "channel": user.displayName,
                  "description": description,
                  "song": songLyrics,
                  "url": url,
                }).then(() => {
                  setDescription('')
                  setSongLyrics('')
                  setImage(null)
                  setOpenVideoUploadBox(false)
                  setSuccess(true);
                  setLoading(false);
                  setDisableBackdropClick(false)
                  setDisableEscapeKeyDown(false)
                  alert('Video uploaded successfully.')
                })
            })
        },
      )
    }
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
            <Dialog
              open={openVideoUploadBox}
              onClose={handleCloseVideoUploadBox}
              disableBackdropClick={disableBackdropClick}
              disableEscapeKeyDown={disableEscapeKeyDown}
            >
              <DialogTitle id="form-dialog-title">Upload your video</DialogTitle>
              <DialogContent>
                {/* <DialogContentText> */}
                  Post a video on your Feed
                  <TextField
                  autoFocus
                  margin="dense"
                  id="description"
                  label="Description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  fullWidth
                />
                <TextField
                  margin="dense"
                  id="song"
                  label="Enter the lyrics of the song"
                  value={songLyrics}
                  onChange={(e) => setSongLyrics(e.target.value)}
                  fullWidth
                />

                <span className="app__videoUploadButton">
                  <input className="app__fileInput" name="fileInput" ref={fileInput} type="file" onChange={handleFileChange} />
                  <Button startIcon={<CameraAltOutlined />} variant="outlined" color="secondary" fullWidth className="app__fileInputButton" onClick={() => { fileInput.current.click() }}>Choose a video</Button>
                </span>

                {/* </DialogContentText> */}
              </DialogContent>
              <DialogActions>
                <Button onClick={handleCloseVideoUploadBox} color="primary">
                  Cancel
                </Button>

                <div className={classes.wrapper}>
                  <Button
                    onClick={handlePostSubmit}
                    color="primary"
                    className={buttonClassname}
                    disabled={loading || !(description && songLyrics && image)}
                  >
                    Upload
                  </Button>
                  {loading && <CircularProgress size={24} className={classes.buttonProgress} />}
                </div>
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
                src="data:image/png;base64,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"
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
                src="data:image/png;base64,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"
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
        {user ? (videos.map(
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
        )) : (
            <Card className="app__noUserDisplayCard">
              <CardContent>
                <Typography variant="h5" component="p" color="primary">
                  Please login to see videos and more...
                </Typography>
              </CardContent>
            </Card>
          )}
      </div>
    </div>
  );
}

export default App;
