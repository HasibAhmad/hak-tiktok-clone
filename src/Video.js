import React, { useEffect, useRef, useState } from 'react'

import { db } from './firebase';
import VideoFooter from './VideoFooter';
import VideoSidebar from './VideoSidebar';
import './Video.css'

function Video({ videoId, url, channel, description, song, messages, shares, onVideoPress, playing, user }) {
  const videoRef = useRef(null);
  const [likedUsers, setLikedUsers] = useState([])
  const [likes, setLikes] = useState(0)
  const [usersMessages, setUsersMessages] = useState([])
  
  // pause the video of scrolling
  useEffect(() => {
    if (!playing) {
      videoRef.current.pause()
    }
  }, [playing])

  useEffect(() => {
    async function getLikedUsersSnapshot() {
      const likedUsersSnapshot = await db
        .collection("videos")
        .doc(videoId)
        .collection("likes").get()
      setLikedUsers(likedUsersSnapshot.docs.map(doc => doc.data().userid))
      setLikes(likedUsers.length)
    }
    getLikedUsersSnapshot()
  }, [videoId, likedUsers, likes])

  useEffect(() => {
    async function getUsersMessagesSnapshot() {
      const usersMessagesSnapshot = await db
        .collection("videos")
        .doc(videoId)
        .collection("messages").orderBy('timestamp', 'desc').get()
      setUsersMessages(usersMessagesSnapshot.docs.map((doc) => ({ 'message': doc.data().message, 'username': doc.data().username })))
    }
    getUsersMessagesSnapshot()
  }, [videoId, usersMessages])

  return (
    <div className="video">
      <video
        className="video__player"
        src={url}
        loop
        onClick={onVideoPress}
        ref={videoRef}
      >
      </video>

      <VideoFooter
        channel={channel}
        description={description}
        song={song}
      />

      <VideoSidebar
        likes={likes}
        messages={usersMessages}
        shares={shares}
        videoId={videoId}
        userUid={user?.uid}
        userName={user?.displayName}
        videoUrl={url}
        channel={channel}
      />
    </div>
  )
}

export default Video
