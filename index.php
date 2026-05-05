<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Online Examiner</title>

<!-- Standard Bootstrap & Fonts -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css">
<!-- Modern premium fonts to match the target UI -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

<!-- AOS Animation Library -->
<link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">

<script src="https://ajax.googleapis.com/ajax/libs/jquery/3.3.1/jquery.min.js"></script>
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/js/bootstrap.min.js"></script>

<?php if(@$_GET['w']) {echo'<script>alert("'.@$_GET['w'].'");</script>';} ?>
<script>
function validateForm() {
    var y = document.forms["form"]["name"].value; var letters = /^[A-Za-z]+$/;
    if (y == null || y == "") {alert("Name must be filled out.");return false;}
    var z =document.forms["form"]["college"].value;
    if (z == null || z == "") {alert("college must be filled out.");return false;}
    var x = document.forms["form"]["email"].value;
    var atpos = x.indexOf("@"); var dotpos = x.lastIndexOf(".");
    if (atpos<1 || dotpos<atpos+2 || dotpos+2>=x.length) {alert("Not a valid e-mail address.");return false;}
    var a = document.forms["form"]["password"].value;
    if(a == null || a == ""){alert("Password must be filled out");return false;}
    if(a.length<5 || a.length>25){alert("Passwords must be 5 to 25 characters long.");return false;}
    var b = document.forms["form"]["cpassword"].value;
    if (a!=b){alert("Passwords must match.");return false;}
}
</script>

<style>
/* ==========================================================================
   GLOBAL VARIABLES & RESET
   ========================================================================== */
:root {
    --bg-color: #050505;
    --grid-color: rgba(255, 255, 255, 0.03);
    --accent-orange: #e85d22;
    --accent-hover: #ff7338;
    --text-main: #ffffff;
    --text-muted: #a0a0a0;
    --font-heading: 'Outfit', sans-serif;
    --font-body: 'Inter', sans-serif;
}

body {
    font-family: var(--font-body);
    line-height: 1.6;
    color: var(--text-muted);
    background-color: var(--bg-color);
    /* Subtle Grid Background from Target UI */
    background-image: 
        linear-gradient(var(--grid-color) 1px, transparent 1px),
        linear-gradient(90deg, var(--grid-color) 1px, transparent 1px);
    background-size: 80px 80px;
    background-attachment: fixed;
    overflow-x: hidden;
}

h1, h2, h3, h4, h5, h6 {
    font-family: var(--font-heading);
    color: var(--text-main);
}

/* ==========================================================================
   PRELOADER (Concentric Circles)
   ========================================================================== */
#preloader {
    position: fixed;
    top: 0; left: 0; right: 0; bottom: 0;
    background: #080808;
    z-index: 99999;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    transition: opacity 0.8s ease-out;
}
.rings-container {
    position: relative;
    width: 300px; height: 300px;
    display: flex; align-items: center; justify-content: center;
}
.ring {
    position: absolute;
    border-radius: 50%;
    border: 1px dashed rgba(255,255,255,0.1);
    animation: rotateRing linear infinite;
}
.ring-1 { width: 300px; height: 300px; animation-duration: 20s; }
.ring-2 { width: 220px; height: 220px; animation-duration: 15s; animation-direction: reverse; }
.ring-3 { width: 140px; height: 140px; animation-duration: 10s; }
.logo-center {
    position: absolute;
    font-family: var(--font-heading);
    font-size: 24px; font-weight: 900;
    color: var(--accent-orange);
}
.progress-text {
    margin-top: 20px;
    font-size: 18px; font-weight: 600; color: #fff;
}
@keyframes rotateRing { 100% { transform: rotate(360deg); } }

/* ==========================================================================
   NAVBAR
   ========================================================================== */
.navbar {
    background: transparent;
    padding: 20px 0;
    border: none;
    transition: all 0.4s ease;
}
.navbar.scrolled {
    background: rgba(5, 5, 5, 0.9);
    backdrop-filter: blur(10px);
    padding: 10px 0;
    border-bottom: 1px solid rgba(255,255,255,0.05);
}
.navbar-brand {
    font-family: var(--font-heading);
    font-weight: 900;
    font-size: 24px;
    color: var(--text-main) !important;
    display: flex; align-items: center; gap: 10px;
}
.navbar-brand span { color: var(--accent-orange); }
.navbar-nav {
    display: flex; align-items: center;
}
.navbar-nav > li > a {
    color: var(--text-main) !important;
    font-size: 13px; font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 1px;
    padding: 10px 15px;
}
.navbar-nav > li > a::before {
    content: "•"; color: var(--accent-orange); margin-right: 6px; font-size: 16px;
}
.navbar-nav > li > a:hover { background: transparent !important; color: var(--accent-orange) !important; }

/* Custom Pill Button in Navbar */
.nav-pill-btn > a {
    background: rgba(255,255,255,0.1) !important;
    border-radius: 50px !important;
    padding: 8px 24px !important;
    margin-left: 15px;
}
.nav-pill-btn > a::before { content: ""; margin: 0; }
.nav-pill-btn.primary-pill > a { background: var(--accent-orange) !important; color: #000 !important; }

/* ==========================================================================
   HERO SECTION (Huge Typography & Floating Elements)
   ========================================================================== */
.hero-wrapper {
    min-height: 100vh;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    text-align: center; padding-top: 100px;
    position: relative;
    overflow: hidden; /* Added to constrain background video */
    z-index: 1; /* Added to keep content above background */
}
.hero-bg-video {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    object-fit: cover; /* Ensures video fills screen without distorting aspect ratio */
    z-index: -2; /* Pushes video to the very back */
    opacity: 0.6; /* Dims the video slightly */
}

.hero-overlay {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* Creates a smooth fade from slightly dark at top to solid background color at bottom */
    background: linear-gradient(to bottom, rgba(5,5,5,0.3) 0%, var(--bg-color) 100%);
    z-index: -1; 
}
.hero-subtitle {
    color: #4CAF50; /* Small green tag like the target site */
    font-size: 14px; font-weight: 600; letter-spacing: 2px;
    margin-bottom: 20px; text-transform: uppercase;
}
.hero-title {
    font-size: clamp(3rem, 7vw, 7rem);
    font-weight: 900;
    line-height: 1.1;
    letter-spacing: -2px;
    max-width: 1000px;
    margin: 0 auto;
}
/* Central Media Area simulating the 3D container */
.hero-media-container {
    position: relative;
    width: 100%; max-width: 800px; height: 400px;
    margin: 60px auto 0;
    background: radial-gradient(circle, rgba(255,255,255,0.05) 0%, transparent 70%);
    display: flex; align-items: center; justify-content: center;
}
/* Glassmorphism Floating Tags */
/* Glassmorphism Floating Tags */
.glass-tag {
    position: absolute;
    background: rgba(255, 255, 255, 0.05);
    backdrop-filter: blur(15px);
    -webkit-backdrop-filter: blur(15px);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 50px;
    padding: 10px 24px;
    color: var(--text-main);
    font-weight: 600; font-size: 14px;
    display: flex; align-items: center; gap: 8px;
    box-shadow: 0 10px 30px rgba(0,0,0,0.5);
    animation: float 6s ease-in-out infinite;
}

/* Update your existing tag classes to these values */
.tag-1 { top: 25%; left: 10%; animation-delay: 0s; }
.tag-2 { bottom: 15%; left: 15%; animation-delay: 2s; }
.tag-3 { bottom: 25%; right: 10%; animation-delay: 1s; }

@keyframes float {
    0% { transform: translateY(0px); }
    50% { transform: translateY(-15px); }
    100% { transform: translateY(0px); }
}
/* ==========================================================================
   ABOUT & SPLIT SECTIONS
   ========================================================================== */
.section-padding { padding: 120px 5%; }
.pill-label {
    display: inline-block;
    border: 1px solid rgba(255,255,255,0.2);
    border-radius: 50px;
    padding: 6px 16px;
    font-size: 12px; font-weight: 600; text-transform: uppercase;
    margin-bottom: 30px; color: var(--text-main);
}
.split-content h2 { font-size: 3.5rem; font-weight: 700; line-height: 1.2; margin-bottom: 20px; }
.split-content p { font-size: 1.1rem; color: var(--text-muted); margin-bottom: 30px; max-width: 90%; }
.image-box {
    width: 100%; height: 600px;
    border-radius: 24px;
    background: #111;
    overflow: hidden;
    position: relative;
}
.image-box img {
    width: 100%; height: 100%; object-fit: cover;
    filter: brightness(0.8) contrast(1.1);
    transition: transform 0.5s ease;
}
.image-box:hover img { transform: scale(1.05); }

/* Standard Buttons */
.btn-custom {
    background: var(--accent-orange);
    color: #000;
    border-radius: 50px;
    padding: 15px 35px;
    font-weight: 700;
    border: none;
    font-size: 16px;
    display: inline-flex; align-items: center; gap: 10px;
    transition: all 0.3s ease;
}
.btn-custom:hover {
    background: var(--accent-hover);
    transform: translateY(-2px);
}
.btn-outline-custom {
    background: transparent;
    border: 1px solid rgba(255,255,255,0.2);
    color: var(--text-main);
}
.btn-outline-custom:hover {
    background: rgba(255,255,255,0.1);
}

/* ==========================================================================
   MODALS (Sleek Dark Theme)
   ========================================================================== */
.modal-content {
    background-color: rgba(15, 15, 15, 0.95);
    backdrop-filter: blur(20px);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 24px;
    box-shadow: 0 25px 50px rgba(0,0,0,0.8);
}
.modal-header { border-bottom: 1px solid rgba(255,255,255,0.05); padding: 25px 30px; }
.modal-title span { color: var(--text-main) !important; font-weight: 700 !important; font-family: var(--font-heading); }
.modal-body { padding: 30px; }
.close { color: #fff; text-shadow: none; opacity: 0.5; }
.close:hover { color: var(--accent-orange); opacity: 1; }
.form-control {
    background-color: rgba(0,0,0,0.5);
    color: #ffffff;
    border: 1px solid rgba(255,255,255,0.1);
    border-radius: 12px;
    padding: 12px 15px;
    height: auto;
}
.form-control:focus {
    border-color: var(--accent-orange);
    box-shadow: 0 0 0 2px rgba(232, 93, 34, 0.2);
    background-color: rgba(0,0,0,0.8);
}
select option { background: #111; color: #fff; }

/* Miscellaneous */
.icon-box {
    background: rgba(255,255,255,0.03);
    border: 1px solid rgba(255,255,255,0.05);
    border-radius: 24px;
    padding: 40px 20px;
    transition: all 0.3s ease;
}
.icon-box:hover { background: rgba(255,255,255,0.05); transform: translateY(-10px); }
.icon-box .material-icons { color: var(--accent-orange); margin-bottom: 20px; }
.carousel-indicators li { border-color: var(--accent-orange); }
.carousel-indicators .active { background-color: var(--accent-orange); }
footer { background: #000; padding: 40px 0; border-top: 1px solid rgba(255,255,255,0.05); margin-top: 50px; }
</style>
</head>

<body id="myPage" data-spy="scroll" data-target=".navbar" data-offset="60">

<!-- Preloader -->
<div id="preloader">
    <div class="rings-container">
        <div class="ring ring-1"></div>
        <div class="ring ring-2"></div>
        <div class="ring ring-3"></div>
        <div class="logo-center">e-EXAM</div>
    </div>
    <div class="progress-text" id="progress-text">0%</div>
</div>

<nav class="navbar navbar-default navbar-fixed-top">
  <div class="container-fluid" style="padding: 0 4%;">
    <div class="navbar-header">
      <button type="button" class="navbar-toggle" data-toggle="collapse" data-target="#myNavbar">
        <span class="icon-bar" style="background-color:#fff;"></span>
        <span class="icon-bar" style="background-color:#fff;"></span>
        <span class="icon-bar" style="background-color:#fff;"></span>                        
      </button>
      <a class="navbar-brand" href="#myPage">
          <i class="material-icons" style="color:var(--accent-orange);">bubble_chart</i> 
          e-Examiner
      </a>
    </div>
    <div class="collapse navbar-collapse" id="myNavbar">
      <ul class="nav navbar-nav navbar-center" style="margin-left: 5vw;">
        <li><a href="#services">Services</a></li>
        <li><a href="#about">About Us</a></li>
        <li><a href="#feedback">Feedback</a></li>
      </ul>
      <ul class="nav navbar-nav navbar-right">
        <!-- Kept functional modal triggers -->
        <li class="nav-pill-btn"><a href="#" data-toggle="modal" data-target="#login">The Creator</a></li>
        <li class="nav-pill-btn"><a href="#" data-toggle="modal" data-target="#login2">Teacher</a></li>
        <li class="nav-pill-btn"><a href="#" data-toggle="modal" data-target="#myModal">Sign In</a></li>
        <li class="nav-pill-btn primary-pill"><a href="#" data-toggle="modal" data-target="#myModal1">Sign Up</a></li>
      </ul>
    </div>
  </div>
</nav>

<!-- Target UI Hero Section -->
<!-- Target UI Hero Section -->
<div class="hero-wrapper">
    <!-- Fullscreen Background Video -->
    <video class="hero-bg-video" autoplay loop muted playsinline>
        <source src="media.mp4" type="video/mp4">
    </video>
    <!-- Dark gradient overlay to blend the video into the background -->
    <div class="hero-overlay"></div>

    <div class="hero-subtitle" data-aos="fade-down" data-aos-duration="1000">It's a Lifestyle 🌱</div>
    <h1 class="hero-title" data-aos="zoom-in" data-aos-duration="1200">
        Test Local, Test <br>Smart, e-Examiner.<br>Online Examination System
    </h1>
    
    <!-- Floating Glassmorphism Badges (Now floating across the whole screen) -->
    <div class="glass-tag tag-1"><i class="material-icons" style="color:#ffcc00; font-size:18px;">bolt</i> Fast Evaluation</div>
    <div class="glass-tag tag-2"><i class="material-icons" style="color:#ff5555; font-size:18px;">security</i> Secure Env</div>
    <div class="glass-tag tag-3"><i class="material-icons" style="color:#55ff55; font-size:18px;">analytics</i> Real-time Stats</div>
</div>

<!-- Target UI Split Section (About) -->
<div id="about" class="container-fluid section-padding">
  <div class="row" style="display:flex; flex-wrap:wrap; align-items:center;">
   <div class="col-md-5 split-content" data-aos="fade-right" data-aos-duration="1000">
  <div class="pill-label">• About Us</div>
  
  <!-- Flex container for side-by-side profiles -->
  <div class="team-container" style="display: flex; gap: 30px; margin-bottom: 40px; justify-content: flex-start; flex-wrap: wrap;">
    
    <!-- Profile 1: Mohammed Afaf Hassan -->
    <div class="user-profile-stack" style="text-align: center; width: 180px;">
      <div class="profile-photo-wrapper" style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; margin: 0 auto 15px; border: 3px solid #333;">
        <img src="afaf12.png" alt="Mohammed Afaf Hassan" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div class="profile-info">
        <h3 style="margin: 0 0 5px 0; font-family: var(--font-heading); color: #fff; font-size: 16px; font-weight: 700;">Mohammed Afaf Hassan</h3>
        <p style="margin: 0 0 8px 0; color: var(--accent-orange); font-weight: 600; font-size: 12px; letter-spacing: 0.5px;">Lead Developer</p>
        <p style="margin: 0; color: #888; font-size: 11px; font-weight: 400;">Bachelor of Computer Applications</p>
      </div>
    </div>

    <!-- Profile 2: Mohammed Owaies -->
    <div class="user-profile-stack" style="text-align: center; width: 180px;">
      <div class="profile-photo-wrapper" style="width: 120px; height: 120px; border-radius: 50%; overflow: hidden; margin: 0 auto 15px; border: 3px solid #333;">
        <img src="owaies3.png" alt="Mohammed Owaies" style="width: 100%; height: 100%; object-fit: cover;">
      </div>
      <div class="profile-info">
        <h3 style="margin: 0 0 5px 0; font-family: var(--font-heading); color: #fff; font-size: 16px; font-weight: 700;">Mohammed Owaies</h3>
        <p style="margin: 0 0 8px 0; color: var(--accent-orange); font-weight: 600; font-size: 12px; letter-spacing: 0.5px;">AI Engineer</p>
        <p style="margin: 0; color: #888; font-size: 11px; font-weight: 400;">Bachelor of Engineering in AIML</p>
      </div>
    </div>

  </div>

  <h2>Prepared With The Highest Quality Tools. Results Delivered Directly To You.</h2>
  <p><strong>Established in 2025</strong> to accommodate modern educational institutions, busy professionals, and everyday students.</p>
  
  <a href="mailto:kingahassan786@gmail.com" class="btn-custom">
    <i class="material-icons">arrow_forward</i> Contact Support
  </a>
</div>

    <div class="col-md-1"></div>
    
    <div class="col-md-6" data-aos="fade-left" data-aos-duration="1000">
      <div class="image-box" style="mask-image: radial-gradient(circle, black 50%, transparent 100%); -webkit-mask-image: radial-gradient(circle, black 50%, transparent 100%);">
        <video 
            autoplay 
            loop 
            muted 
            playsinline 
            style="width: 100%; height: 100%; object-fit: cover; filter: brightness(0.7) contrast(1.2);">
            <source src="media4.mp4" type="video/mp4">
        </video>
      </div>
    </div>
  </div>
</div>

<!-- Container (Services Section) -->
<div id="services" class="container-fluid section-padding text-center">
  <div class="pill-label" data-aos="fade-up">• Services</div>
  <h2 data-aos="fade-up" style="margin-bottom: 50px;">What We Offer</h2>
  
  <div class="row">
    <div class="col-sm-4" data-aos="fade-up" data-aos-delay="100">
      <div class="icon-box">
          <i class="material-icons" style="font-size:50px;">group_add</i>
          <h4>E-EXAMINATION</h4>
          <p>Multiple users, One seamless platform.</p>
      </div>
    </div>
    <div class="col-sm-4" data-aos="fade-up" data-aos-delay="200">
      <div class="icon-box">
          <i class="material-icons" style="font-size:50px;">savings</i>
          <h4>COST OPTIMISED</h4>
          <p>Reduces paperwork and administrative overhead.</p>
      </div>
    </div>
    <div class="col-sm-4" data-aos="fade-up" data-aos-delay="300">
      <div class="icon-box">
          <i class="material-icons" style="font-size:50px;">verified_user</i>
          <h4>USER SATISFACTION</h4>
          <p>User satisfaction is our ultimate goal.</p>
      </div>
    </div>
  </div>
</div>

<!-- Testimonials -->
<div class="container-fluid section-padding text-center" style="background: rgba(255,255,255,0.01);">
  <h2 data-aos="fade-up">What our Users say</h2>
  <div id="myCarousel" class="carousel slide" data-ride="carousel" data-aos="zoom-in" style="max-width: 800px; margin: 0 auto;">
    <ol class="carousel-indicators" style="bottom: -50px;">
      <li data-target="#myCarousel" data-slide-to="0" class="active"></li>
      <li data-target="#myCarousel" data-slide-to="1"></li>
      <li data-target="#myCarousel" data-slide-to="2"></li>
    </ol>
    <div class="carousel-inner" role="listbox">
      <div class="item active text-center" style="padding: 40px 0;">
        <h4 style="font-style: italic; font-weight: 300; font-size: 24px;">"Very good initiative. I am so happy with the result!"<br><br><span style="color:var(--accent-orange); font-style: normal; font-weight:700; font-size:16px;">Michael Roe, Vice President</span></h4>
      </div>
      <div class="item text-center" style="padding: 40px 0;">
        <h4 style="font-style: italic; font-weight: 300; font-size: 24px;">"One word... WOW!!"<br><br><span style="color:var(--accent-orange); font-style: normal; font-weight:700; font-size:16px;">John Doe, Salesman</span></h4>
      </div>
      <div class="item text-center" style="padding: 40px 0;">
        <h4 style="font-style: italic; font-weight: 300; font-size: 24px;">"Could I... BE any more happy with this platform"<br><br><span style="color:var(--accent-orange); font-style: normal; font-weight:700; font-size:16px;">Chandler Bing, Actor</span></h4>
      </div>
    </div>
  </div>
</div>

<!-- Feedback Section -->
<div id="feedback" class="container-fluid section-padding">
  <div class="row">
    <div class="col-sm-5" data-aos="fade-right">
      <div class="pill-label">• Feedback</div>
      <h2>We Value Your Input</h2>
      <p>You are free to provide us your suggestions and feedback to help us improve the platform.</p>
    </div>
    <div class="col-sm-7" data-aos="fade-left">
      <div class="icon-box" style="padding: 40px;">
      <?php if(@$_GET['q'])echo '<span style="font-size:18px; color:var(--accent-orange);">'.@$_GET['q'].'</span>';
      else {echo'
      <form role="form" method="post" action="feed.php?q=index.php">
      <div class="row">
        <div class="col-sm-6 form-group">
          <input class="form-control" id="name" name="name" placeholder="Name" type="text" required>
        </div>
        <div class="col-sm-6 form-group">
          <input class="form-control" id="email" name="email" placeholder="Email" type="email" required>
        </div>
        <div class="col-sm-12 form-group">
          <input class="form-control" id="subject" name="subject" placeholder="Subject" type="text" required>
        </div>
      </div>
      <textarea class="form-control" id="comments" name="feedback" placeholder="Comment" rows="4" style="margin-bottom: 20px;"></textarea>
      <button class="btn-custom" name="submit" type="submit" style="width: 100%; justify-content: center;">SEND MESSAGE</button>
      </form>';}?>
      </div>
    </div>
  </div>
</div>

<!-- ==========================================================================
     ALL MODALS (PHP Logic Preserved, Styling Updated)
     ========================================================================== -->

<!-- Admin Login -->
<div class="modal fade" id="login">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">&times;</button>
        <h4 class="modal-title"><span>LOGIN - ADMIN</span></h4>
      </div>
      <div class="modal-body">
            <form role="form" method="post" action="head.php?q=index.php">
              <div class="form-group">
                <input type="text" name="uname" maxlength="20" placeholder="Admin user id" class="form-control"/> 
              </div>
              <div class="form-group">
                <input type="password" name="password" maxlength="15" placeholder="Password" class="form-control"/>
              </div>
              <button type="submit" name="login" class="btn-custom" style="width: 100%; justify-content:center;">Login</button>
            </form>
      </div>
    </div>
  </div>
</div>

<!-- Teacher Login -->
<div class="modal fade" id="login2">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">&times;</button>
        <h4 class="modal-title"><span>LOGIN - TEACHER</span></h4>
      </div>
      <div class="modal-body">
            <form role="form" method="post" action="admin.php?q=index.php">
              <div class="form-group">
                <input type="text" name="uname" maxlength="20" placeholder="Teacher user id" class="form-control"/> 
              </div>
              <div class="form-group">
                <input type="password" name="password" maxlength="15" placeholder="Password" class="form-control"/>
              </div>
              <button type="submit" name="login2" class="btn-custom" style="width: 100%; justify-content:center;">Login</button>
            </form>
      </div>
    </div>
  </div>
</div>

<!-- User Login -->
<div class="modal fade" id="myModal">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">&times;</button>
        <h4 class="modal-title"><span>LOGIN - USER</span></h4>
      </div>
      <div class="modal-body">
        <form action="login.php?q=index.php" method="POST">
            <div class="form-group">
                <input id="email" name="email" placeholder="Enter your email-id" class="form-control" type="email">
            </div>
            <div class="form-group">
                <input id="password" name="password" placeholder="Enter your Password" class="form-control" type="password">
            </div>
            <button type="submit" class="btn-custom" style="width: 100%; justify-content:center;">Log in</button>
        </form>
      </div>
    </div>
  </div>
</div>

<!-- User Sign Up -->
<div class="modal fade" id="myModal1">
  <div class="modal-dialog">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal">&times;</button>
        <h4 class="modal-title"><span>SIGN UP</span></h4>
      </div>
      <div class="modal-body">
        <form name="form" action="sign.php?q=account.php" onSubmit="return validateForm()" method="POST">
            <div class="form-group">
              <input id="name" name="name" placeholder="Enter your name" class="form-control" type="text">
            </div>
            <div class="form-group">
                <select id="gender" name="gender" class="form-control" >
                  <option value="Male">Select Gender</option>
                  <option value="M">Male</option>
                  <option value="F">Female</option> 
                </select>
            </div>
            <div class="form-group">
              <input id="college" name="college" placeholder="Enter your college name" class="form-control" type="text">
            </div>
            <div class="form-group">
                <input id="email" name="email" placeholder="Enter your email-id" class="form-control" type="email">
            </div>
            <div class="form-group">
                <input id="mob" name="mob" placeholder="Enter 10-digit mobile number" class="form-control" type="tel" pattern="[0-9]{10}" maxlength="10" minlength="10" required>
            </div>
            <div class="form-group">
                <input id="password" name="password" placeholder="Enter your password" class="form-control" type="password">
            </div>
            <div class="form-group">
                <input id="cpassword" name="cpassword" placeholder="Confirm Password" class="form-control" type="password">
            </div>
            <?php if(@$_GET['q7']) { echo'<p style="color:red;font-size:14px; text-align:center;">'.@$_GET['q7'].'</p>';}?>
            <button type="submit" class="btn-custom" style="width: 100%; justify-content:center;">Sign Up</button>
        </form>
      </div>
    </div>
  </div>
</div>

<footer class="container-fluid text-center">
  <a href="#myPage" title="To Top" style="display:inline-block; margin-bottom:20px;">
    <i class="material-icons" style="font-size: 30px; color: var(--accent-orange);">arrow_upward</i>
  </a>
  <p style="margin: 0; font-size: 13px; letter-spacing: 1px;">e-EXAMINER &copy; 2026. ALL RIGHTS RESERVED.</p>
</footer>

<!-- Initialize AOS Library & Scripts -->
<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
<script>
$(document).ready(function(){
  // Preloader Logic matching Screenshot 2
  let progress = 0;
  const progressText = document.getElementById('progress-text');
  const preloader = document.getElementById('preloader');
  
  const interval = setInterval(() => {
      progress += Math.floor(Math.random() * 10) + 5;
      if(progress >= 100) {
          progress = 100;
          progressText.innerText = progress + "%";
          clearInterval(interval);
          setTimeout(() => {
              preloader.style.opacity = "0";
              setTimeout(() => { preloader.style.display = "none"; }, 800);
          }, 300);
      } else {
          progressText.innerText = progress + "%";
      }
  }, 150);

  // Initialize AOS
  AOS.init({ once: true, offset: 100 });

  // Navbar transparent-to-solid on scroll
  $(window).scroll(function() {
      if ($(window).scrollTop() > 50) {
          $('.navbar').addClass('scrolled');
      } else {
          $('.navbar').removeClass('scrolled');
      }
  });

  // Smooth scrolling
  $(".navbar a, footer a[href='#myPage']").on('click', function(event) {
    if (this.hash !== "" && !$(this).attr('data-toggle')) {
      event.preventDefault();
      var hash = this.hash;
      $('html, body').animate({ scrollTop: $(hash).offset().top }, 900, function(){
        window.location.hash = hash;
      });
    } 
  });
});
</script>
</body>
</html>