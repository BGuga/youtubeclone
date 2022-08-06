import User from "../models/User"
import fetch from "node-fetch";
import bcrypt from "bcrypt";

export const getJoin = (req, res) => res.render("join", { pageTitle: "Join" });
export const postJoin = async(req, res) => {
  const { name, username, email, password, password2, location } = req.body;
  const pageTitle = "Join";
  if (password !== password2) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "Password confirmation does not match.",
    });
  }
  const exists = await User.exists({ $or: [{ username }, { email }] });
  if (exists) {
    return res.status(400).render("join", {
      pageTitle,
      errorMessage: "This username/email is already taken.",
    });
  }
  try {
    await User.create({
      name,
      username,
      email,
      password,
      location,
    });
    return res.redirect("/login");
  } catch(error){
    return res.status(400).render("join", { 
      pageTitle: "Upload Video" ,
      errorMessage: error._message,
  });
}
};
export const getLogin = (req, res)=> 
res.render("login",{pageTitle:"Login"});

export const postLogin = async(req, res) =>{
  const {username, password}= req.body;
  const pageTitle ="Login"
  const user = await User.findOne({ username,socialOnly:false})
  if(!user){
    return res.status(400).render("login",{
      pageTitle, 
      errorMessage:"An account with  this username does not exists."
    });
  }
  const ok = await bcrypt.compare(password, user.password);
  if(!ok){
    return res.status(400).render("login",{
      pageTitle, 
      errorMessage:"Wrong password"
    });
  }
  req.session.loggedIn = true;
  req.session.user = user;
  return res.redirect("/");
}

export const startGithubLogin = (req, res) => {
  const baseUrl = "https://github.com/login/oauth/authorize";
  const config = {
    client_id: process.env.GH_CLIENT,
    allow_signup: false,
    scope: "read:user user:email",
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  return res.redirect(finalUrl);
};

export const finishGithubLogin = async (req, res) => {
  const baseUrl = "https://github.com/login/oauth/access_token";
  const config = {
    client_id: process.env.GH_CLIENT,
    client_secret: process.env.GH_SECRET,
    code: req.query.code,
  };
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseUrl}?${params}`;
  const tokenRequest = await (
    await fetch(finalUrl, {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
    })
  ).json();
  if ("access_token" in tokenRequest) {
    const { access_token } = tokenRequest;
    const apiUrl = "https://api.github.com";
    const userData = await (
      await fetch(`${apiUrl}/user`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailData = await (
      await fetch(`${apiUrl}/user/emails`, {
        headers: {
          Authorization: `token ${access_token}`,
        },
      })
    ).json();
    const emailObj = emailData.find(
      (email) => email.primary === true && email.verified === true
    );
    if (!emailObj) {
      return res.redirect("/login");
    }
    let user = await User.findOne({ email: emailObj.email });
    if (!user) {
      user = await User.create({
        avatarUrl: userData.avatar_url,
        name: userData.name,
        username: userData.login,
        email: emailObj.email,
        password: "",
        socialOnly: true,
        location: userData.location,
      });
    }
    req.session.loggedIn = true;
    req.session.user = user;
    return res.redirect("/");
  } else {
    return res.redirect("/login");
  }
};

export const logout = (req, res)=> {
  req.flash("info", "Bye Bye");
  req.session.destroy();
  return res.redirect("/");
};
export const getEdit = (req, res)=>{
  return res.render("edit-profile", {pageTitle : "Edit Profile"});
}
export const postEdit = async(req, res) =>{
  const {
    session:{
    user:{_id, email:originemail, username:originusername,socialOnly, avatarUrl},
    },
    body:{name,email,username,location},
    file,
  }=req;
  
  if(originemail!==email)
  {
    const kak=await User.exists({email})
    if(kak)
    {
      return res.status(400).render("edit-profile",{pageTitle: "fail edit" ,errorMessage:"this email is already taken",})
    }
  }

  if(originusername!==username)
  {
    const aka=await User.exists({username})
    if(aka)
    {
      return res.status(400).render("edit-profile",{pageTitle: "fail edit" ,errorMessage:"this username is already taken",})
    }
  }
  if((originusername!==username||originemail!==email)&&socialOnly)
  {
    return res.status(400).render("edit-profile",{pageTitle: "fail edit" ,errorMessage:"Social login can't change data",})
  }

  const isHeroku = process.env.NODE_ENV ==="production";

  const updatedUser=await User.findByIdAndUpdate(_id,{
    avatarUrl : file ? (isHeroku ? file.location : "/" + file.path): avatarUrl,
    name,
    email,
    username,
    location,
  },{new:true});
  req.session.user = updatedUser;
  return res.redirect("/users/edit");
}

export const getChangePassword = (req,res)=>{
  if(req.session.user.socialOnly===true){
    req.flash("error", "Can't change password.");
    return res.redirect("/");
  }
  return res.render("users/change-password",{pageTitle:"Change Password"})
};

export const postChangePassword = async(req,res)=>{
  const {
    session:{
    user:{_id},
    },
    body:{oldPassword, newPassword,newPasswordConfirmation}
  }=req;
  const user = await User.findById(_id);
  const ok = await bcrypt.compare(oldPassword, user.password)
  if(!ok){
    return res.status(400).render("users/change-password",{pageTitle:"Change Password",errorMessage: "The current password  is incorrect"})

  }
  if(newPassword!==newPasswordConfirmation)
  {
    return res.status(400).render("users/change-password",{pageTitle:"Change Password",errorMessage: "The passwrod does not match the confirmation"})
  }
  user.password=newPassword;
  user.save();
  req.flash("info", "Password updated");
  res.redirect("/users/logout");
}

export const see = async(req, res)=> {
  const {id}=req.params;
  const user = await User.findById(id).populate({
    path: "videos",
    populate: {
      path: "owner",
      model: "User",
    },
  });
  if(!user){
    return res.status(400).render("404",{pageTitle:"User not found"});
  }
  return res.render("users/profile",{
    pageTitle:user.name,
    user,
  })
}

export const kakaoStart =(req, res)=>{
  const baseURL = "https://kauth.kakao.com/oauth/authorize"
  const config ={
      client_id:process.env.Kakao_id,
      redirect_uri:"http://localhost:4000/users/kakao/finish",
      response_type:"code",
  }
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseURL}?${params}`;
  return res.redirect(finalUrl);
}

export const kakaofinish = async(req,res)=>{
  const baseURL = "https://kauth.kakao.com/oauth/token"
  const {code} = req.query;
  const config ={
      grant_type:"authorization_code",
      client_id:process.env.Kakao_id,
      redirect_uri:"http://localhost:4000/users/kakao/finish",
      code,
      client_secret:process.env.Kakao_secret,
  }
  const params = new URLSearchParams(config).toString();
  const finalUrl = `${baseURL}?${params}`
  const response =await(await fetch(finalUrl, {
      method: 'post',
      headers: {'Content-Type': 'application/json'}
  })).json();
  if ("access_token" in response) {
      const { access_token } = response;
      const userRequest = await (
        await fetch("https://kapi.kakao.com/v2/user/me", {
          headers: {
            Authorization: `Bearer ${access_token}`,
            "Content-type": "application/json",
          },
        })
      ).json();
      let user = await User.findOne({ email:userRequest.kakao_account.email})
      if(!user){
          user = await User.create({
              avatarUrl: userRequest.properties.profile_image,
              name: userRequest.properties.nickname,
              username:userRequest.properties.nickname,
              email: userRequest.kakao_account.email,
              password: "",
              socialOnly: true,
              location: "",
          })}
          req.session.loggedIn = true;
          req.session.user=user;
          return res.redirect("/");
    } else {
      return res.redirect("/login");
    } 
}
