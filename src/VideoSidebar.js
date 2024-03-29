import React, { useEffect, useState } from 'react'
import { Avatar, Dialog, DialogActions, DialogContent, DialogTitle, IconButton, List, ListItem, ListItemAvatar, ListItemText, makeStyles, Popover, Slide, TextField, Tooltip, Zoom } from '@material-ui/core';
import { Delete, Favorite, FavoriteBorder, HighlightOff, Message, SendRounded, Share } from '@material-ui/icons'
import firebase from 'firebase'
import { FacebookIcon, FacebookShareButton, TelegramIcon, TelegramShareButton, ViberIcon, ViberShareButton, WhatsappIcon, WhatsappShareButton } from 'react-share';
import { Menu, MenuItem } from '@material-ui/core';
import MoreVertIcon from '@material-ui/icons/MoreVert';

import { db } from './firebase'
import './VideoSidebar.css'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function VideoSidebar({ likes, messages, videoId, userUid, userName, videoUrl, channel }) {
  const [liked, setLiked] = useState(false)
  const [openMessages, setOpenMessages] = React.useState(false);
  const [userMessage, setUserMessage] = React.useState('')
  const [shareMenuOpen, setShareMenuOpen] = React.useState(false)
  const [anchorEl, setAnchorEl] = useState(null);
  const shareButtonRef = React.useRef('')

  const useStyles = makeStyles((theme) => ({
    paper: { minWidth: "900px" },
    root: {
      width: '100%',
      maxWidth: '36ch',
      backgroundColor: theme.palette.background.paper,
    },
    inline: {
      display: 'inline',
    },
  }));

  useEffect(() => {
    db.collection("videos")
      .doc(videoId)
      .collection("likes")
      .onSnapshot((snapshot) => {
        snapshot.docs.forEach((doc) => {
          let docUserId = doc.data().userid
          if (docUserId === userUid) {
            setLiked(true)
          } else {
            setLiked(false)
          }
        })
      })

  }, [videoId, userUid])

  const classes = useStyles()

  const handleClickOpenMessages = () => {
    setOpenMessages(true);
  };

  const handleCloseMessages = () => {
    setOpenMessages(false);
  };

  const handleUserMessageChange = (event) => {
    setUserMessage(event.target.value);
  };


  const onLikeVideo = () => {
    db.collection("videos")
      .doc(videoId)
      .collection("likes").add({
        "userid": userUid
      }).then(() => {
        setLiked(true)
      })
  }

  const onDisLikeVideo = () => {
    db.collection("videos")
      .doc(videoId)
      .collection("likes").where('userid', '==', userUid)
      .get()
      .then((docs) => {
        docs.forEach((doc) => {
          doc.ref.delete()
        })
      }).then(() => {
        setLiked(false)
      })
  }

  const addUserComment = () => {
    db.collection("videos")
      .doc(videoId)
      .collection("messages")
      .add({
        'message': userMessage,
        'username': userName,
        'timestamp': firebase.firestore.FieldValue.serverTimestamp(),
      })
      .then(
        setUserMessage('')
      )
  }

  const clearUserMessage = () => {
    setUserMessage('')
  }

  const handleShareButtonClick = () => {
    setShareMenuOpen(true)
  }

  const shareMenuClose = () => {
    setShareMenuOpen(false)
  }

  const handleDeleteVideo = () => {
    if(channel===userName) {
      db.collection("videos").doc(videoId).delete()
    } else {
      alert('You can delete your videos onl1!')
    }
    handleClose()
  }

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  return (
    <div className="videoSidebar">
      
      <div className="videoSidebar__deleteOption">
        <IconButton className="videoSidebar__IconButton" onClick={handleClick}>
          <MoreVertIcon className="videoSidebar__deleteIcon" fontSize="small" />
        </IconButton>
      </div>

      <Menu
        anchorEl={anchorEl}
        keepMounted
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem disabled={channel!==userName}  onClick={handleDeleteVideo}><Delete /></MenuItem>
      </Menu>


      <div className="videoSidebar__buttons">
        {liked ? (
          <Favorite fontSize="large" onClick={onDisLikeVideo} />
        ) : (
            <FavoriteBorder fontSize="large" onClick={onLikeVideo} />
          )
        }
        <p>{likes}</p>
      </div>

      <div className="videoSidebar__buttons" onClick={handleClickOpenMessages}>
        <Message fontSize="large" />
        <p>{messages.length}</p>
      </div>

      <div className="videoSidebar__buttons">
        <Share ref={shareButtonRef} onClick={handleShareButtonClick} fontSize="large" />

        {/* shareButtonsPopover */}
        <Popover
          open={shareMenuOpen}
          anchorEl={shareButtonRef.current}
          onClose={shareMenuClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          <FacebookShareButton
            url={videoUrl}
            quote={"HAK-TikTok video"}
            hashtag="#hak_tiktokvideo"
            className='videoSidebar__shareButtons'
          >
            <FacebookIcon size={36} />
          </FacebookShareButton>

          <WhatsappShareButton
            url={videoUrl}
            title={videoUrl}
            separator=":: "
            className='videoSidebar__shareButtons'
          >
            <WhatsappIcon size={36} />
          </WhatsappShareButton>

          <ViberShareButton
            url={videoUrl}
            title={videoUrl}
            className='videoSidebar__shareButtons'
          >
            <ViberIcon size={36} />
          </ViberShareButton>

          <TelegramShareButton
            url={videoUrl}
            title={videoUrl}
            className='videoSidebar__shareButtons'
            style={{ 'margin-right': '3px' }}
          >
            <TelegramIcon size={36} />
          </TelegramShareButton>
        </Popover>
        <p>share</p>
      </div>

      {/* messagesDialogBox */}
      <Dialog
        open={openMessages}
        TransitionComponent={Transition}
        keepMounted
        onClose={handleCloseMessages}
        aria-labelledby="alert-dialog-slide-title"
        aria-describedby="alert-dialog-slide-description"
        className="videoSidebar__messagesDialogBox"
        maxWidth="sm"
      >
        <DialogTitle className="videoSidebar__userMessageBox" id="alert-dialog-slide-title">Messages</DialogTitle>
        <DialogContent className="videoSidebar__userMessageBox">
          <List className={classes.root}>
            {messages.map(({ username, message }) => (
              <ListItem key={username + message} alignItems="flex-start">
                <ListItemAvatar>
                  <Avatar >{username.match(/\b(\w)/g).join('').toUpperCase()}</Avatar>
                </ListItemAvatar>
                <ListItemText
                  primary={username}
                  secondary={
                    <React.Fragment>
                      {message}
                    </React.Fragment>
                  }
                />
              </ListItem>
            ))}
          </List>
        </DialogContent>
        <DialogActions id="alert-dialog-slide-title" className="videoSidebar__userMessageBox">
          <Tooltip TransitionComponent={Zoom} arrow title="Delete">
            <span>
              <IconButton disabled={userMessage.length > 0 ? false : true} onClick={clearUserMessage} color="primary">
                <HighlightOff fontSize="large" />
              </IconButton>
            </span>
          </Tooltip>
          <div className="TextField-without-border-radius">
            <TextField
              id="user-message"
              // label="add a comment..."
              variant="outlined"
              color="primary"
              multiline
              maxRows={3}
              value={userMessage}
              onChange={handleUserMessageChange}
            />
          </div>
          <IconButton disabled={userMessage.length > 0 ? false : true} onClick={addUserComment} color="primary">
            <SendRounded fontSize="large" />
          </IconButton>
        </DialogActions>
      </Dialog>
    </div>
  )
}

export default VideoSidebar
