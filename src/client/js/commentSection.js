const videoContainer = document.getElementById("videoContainer");
const form = document.getElementById("commentForm");
const deletebtns = document.querySelectorAll(".delete__comment");

const addComment = (text, id) => {
  const videoComments = document.querySelector(".video__comments ul");
  const newComment = document.createElement("li");
  newComment.dataset.id = id;
  newComment.className = "video__comment";
  const icon = document.createElement("i");
  icon.className = "fas fa-comment";
  const span = document.createElement("span");
  span.innerText = ` ${text}`;
  const button = document.createElement("button");
  button.innerText = "❌";
  button.addEventListener("click", deletecomment);
  span.appendChild(button);
  newComment.appendChild(icon);
  newComment.appendChild(span);
  videoComments.prepend(newComment);
};

const handleSubmit = async (event) => {
  event.preventDefault();
  const textarea = form.querySelector("textarea");
  const text = textarea.value;
  const videoId = videoContainer.dataset.id;
  if (text === "") {
    return;
  }
  const response = await fetch(`/api/videos/${videoId}/comment`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ text }),
  });
  textarea.value = "";
  if (response.status === 201) {
    textarea.value = "";
    const { newCommentId } = await response.json();
    addComment(text, newCommentId);
  }
};

const deletecomment = async (event) => {
  const li = event.target.parentElement.parentElement;
  const commentId = li.dataset.id;
  const response = await fetch(`/api/comments/${commentId}/delete`, {
    method: "DELETE",
  });
  if (response.status === 201) {
    li.remove();
  }
};

if (form) {
  form.addEventListener("submit", handleSubmit);
}
if (deletebtns) {
  deletebtns.forEach((deletebtn) => {
    deletebtn.addEventListener("click", deletecomment);
  });
}
