const homeVideos = document.querySelectorAll(".video-mixin__thumb");

const handleMouseEnter = (event) => {
  const target = event.target;
  const videofile = target.dataset.fileurl;
  const thumb = target.querySelector("img");
  thumb.hidden = true;
  const thumbvideo = document.createElement("video");
  thumbvideo.src = videofile;
  thumbvideo.autoplay = true;
  thumbvideo.classList.add("thumbvideo");
  target.appendChild(thumbvideo);
};

const handleMouseLeave = (evnet) => {
  const target = event.target;
  const thumbvideo = event.target.querySelector("video");
  thumbvideo.remove();
  const thumb = target.querySelector("img");
  thumb.hidden = false;
};

homeVideos.forEach((homevideo) => {
  homevideo.addEventListener("mouseenter", handleMouseEnter);
  homevideo.addEventListener("mouseleave", handleMouseLeave);
});
