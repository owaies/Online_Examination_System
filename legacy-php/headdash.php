<?php
session_start();
if(!(isset($_SESSION['email']))){
    header("location:index.php");
    exit;
}
include_once 'dbConnection.php';
$email = $_SESSION['email'];
$name = isset($_SESSION['name']) ? $_SESSION['name'] : $email;
?>
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Online Examiner - Admin</title>

<!-- Standard Bootstrap -->
<link rel="stylesheet" href="css/bootstrap.min.css"/>
<link rel="stylesheet" href="css/bootstrap-theme.min.css"/>    

<!-- Modern Premium Fonts & Icons -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

<!-- AOS Animation Library -->
<link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">

<!-- Scripts -->
<script src="js/jquery.js" type="text/javascript"></script>
<script src="js/bootstrap.min.js" type="text/javascript"></script>

<style>
/* ==========================================================================
   GLOBAL VARIABLES & RESET (Forced Dark Theme)
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
    font-family: var(--font-body) !important;
    line-height: 1.6;
    color: var(--text-muted) !important;
    background-color: var(--bg-color) !important;
    background-image: linear-gradient(var(--grid-color) 1px, transparent 1px), linear-gradient(90deg, var(--grid-color) 1px, transparent 1px) !important;
    background-size: 80px 80px !important;
    background-attachment: fixed !important;
    overflow-x: hidden;
    padding-top: 80px; 
}

h1, h2, h3, h4, h5, h6, .title, .title1 {
    font-family: var(--font-heading) !important; color: var(--text-main) !important;
}

/* Unified Navbar */
.navbar-default {
    background: rgba(15, 15, 15, 0.95) !important; backdrop-filter: blur(10px) !important; border: none !important; border-bottom: 1px solid rgba(255,255,255,0.05) !important; padding: 10px 0;
}
.navbar-brand { display: flex; align-items: center; gap: 10px; }
.navbar-brand span.main-text { font-family: var(--font-heading); font-weight: 900; font-size: 24px; color: var(--text-main); }
.navbar-brand span.sub-text { font-size: 14px; color: var(--text-muted); font-weight: 400; margin-left: 5px; }

.navbar-default .navbar-nav > li > a { color: var(--text-main) !important; font-weight: 600; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; }
.navbar-default .navbar-nav > .active > a, .navbar-default .navbar-nav > li > a:hover { background-color: transparent !important; color: var(--accent-orange) !important; }

/* Dropdowns */
.navbar-default .navbar-nav > .open > a, .navbar-default .navbar-nav > .open > a:hover, .navbar-default .navbar-nav > .open > a:focus {
    background-color: transparent !important; color: var(--accent-orange) !important;
}
.dropdown-menu { background-color: rgba(15,15,15,0.95) !important; border: 1px solid rgba(255,255,255,0.1) !important; }
.dropdown-menu > li > a { color: var(--text-main) !important; padding: 10px 20px; }
.dropdown-menu > li > a:hover { background-color: rgba(255,255,255,0.05) !important; color: var(--accent-orange) !important; }

/* Logout Button */
.logout-pill > a {
    background: var(--accent-orange) !important; color: #000 !important; border-radius: 50px !important; padding: 6px 20px !important; margin-top: 10px; margin-left: 15px; transition: all 0.3s ease;
}
.logout-pill > a:hover { background: var(--accent-hover) !important; transform: translateY(-2px); box-shadow: 0 5px 15px rgba(232, 93, 34, 0.3); }

/* Panels & Tables */
.panel {
    background-color: rgba(15, 15, 15, 0.95) !important; backdrop-filter: blur(20px); border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 16px !important; box-shadow: 0 20px 40px rgba(0,0,0,0.8) !important; padding: 30px; margin-bottom: 40px; color: var(--text-main) !important;
}
.table { color: var(--text-muted) !important; margin-bottom: 0;}
.table > tbody > tr > td, .table > tbody > tr > th { border-top: 1px solid rgba(255,255,255,0.05) !important; vertical-align: middle; padding: 15px 8px; }
.table-striped > tbody > tr:nth-of-type(odd) { background-color: rgba(255, 255, 255, 0.02) !important; }
.table-striped > tbody > tr:hover { background-color: rgba(255, 255, 255, 0.05) !important; }
tr td b { color: var(--text-main) !important; }

/* Buttons & Forms */
.btn-primary { background: var(--accent-orange) !important; color: #000 !important; border-radius: 50px !important; padding: 10px 24px !important; font-weight: 700 !important; border: none !important; transition: all 0.3s ease !important; }
.btn-primary:hover { background: var(--accent-hover) !important; transform: translateY(-2px); box-shadow: 0 10px 20px rgba(232, 93, 34, 0.3) !important; text-decoration: none; }
.form-control { background-color: rgba(0,0,0,0.5) !important; color: #ffffff !important; border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 12px !important; padding: 12px 15px !important; height: auto !important; }
.form-control:focus { border-color: var(--accent-orange) !important; box-shadow: 0 0 0 2px rgba(232, 93, 34, 0.2) !important; }
</style>
</head>

<body>

<!-- UNIFIED NAVBAR -->
<nav class="navbar navbar-default navbar-fixed-top">
  <div class="container-fluid" style="padding: 0 4%;">
    <div class="navbar-header">
      <button type="button" class="navbar-toggle collapsed" data-toggle="collapse" data-target="#main-nav" aria-expanded="false">
        <span class="sr-only">Toggle navigation</span>
        <span class="icon-bar" style="background:#fff;"></span>
        <span class="icon-bar" style="background:#fff;"></span>
        <span class="icon-bar" style="background:#fff;"></span>
      </button>
      <a class="navbar-brand" href="headdash.php?q=0">
        <i class="material-icons" style="color:var(--accent-orange);">bubble_chart</i>
        <span class="main-text">e-Examiner</span>
        <span class="sub-text">| Admin Dashboard</span>
      </a>
    </div>
    <div class="collapse navbar-collapse" id="main-nav">
      <ul class="nav navbar-nav" style="margin-left: 30px;">
        <li <?php if(@$_GET['q']==0) echo'class="active"'; ?>><a href="headdash.php?q=0">Home</a></li>
        <li <?php if(@$_GET['q']==1) echo'class="active"'; ?>><a href="headdash.php?q=1">User</a></li>
        <li <?php if(@$_GET['q']==2) echo'class="active"'; ?>><a href="headdash.php?q=2">Ranking</a></li>
        <li <?php if(@$_GET['q']==3) echo'class="active"'; ?>><a href="headdash.php?q=3">Feedback</a></li>
        <li class="dropdown <?php if(@$_GET['q']==4 || @$_GET['q']==5) echo'active'; ?>">
          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Admin Options <span class="caret"></span></a>
          <ul class="dropdown-menu">
            <li><a href="headdash.php?q=4">Add Admin</a></li>
            <li><a href="headdash.php?q=5">Remove Admin</a></li>
          </ul>
        </li>
      </ul> 
      <ul class="nav navbar-nav navbar-right">
        <li><a href="#" style="cursor:default;">Welcome, <span style="color:var(--accent-orange);"><?php echo $name; ?></span></a></li>
        <li class="logout-pill"><a href="logout.php?q=headdash.php"><i class="material-icons" style="font-size:16px; vertical-align:middle;">logout</i> Signout</a></li>
      </ul>
    </div>
  </div>
</nav>

<div class="container">
<div class="row">
<div class="col-md-12">

<!--home start-->
<?php if(@$_GET['q']==0) {
    $result = db_query($con,"SELECT * FROM quiz ORDER BY date DESC") or die('Error');
    echo  '<div class="panel" data-aos="fade-up"><div class="table-responsive"><table class="table table-striped title1">
    <tr><td><b>S.N.</b></td><td><b>Topic</b></td><td><b>Total question</b></td><td><b>Marks</b></td><td><b>positive</b></td><td><b>negative</b></td><td><b>Time limit</b></td><td></td></tr>';
    $c=1;
    while($row = db_fetch_array($result)) {
        $title = $row['title'];
        $total = $row['total'];
        $sahi = $row['sahi'];
        $wrong = $row['wrong'];
        $time = $row['time'];
        $eid = $row['eid'];
        $q12=db_query($con,"SELECT score FROM history WHERE eid='$eid' AND email='$email'" )or die('Error98');
        $rowcount=db_num_rows($q12);	
        if($rowcount == 0){
            echo '<tr><td>'.$c++.'</td><td>'.$title.'</td><td>'.$total.'</td><td>'.$sahi*$total.'</td><td>'.$sahi.'</td><td>'.$wrong.'</td><td>'.$time.'&nbsp;min</td></tr>';
        } else {
            echo '<tr style="color:var(--accent-orange);"><td>'.$c++.'</td><td>'.$title.'&nbsp;<span title="This quiz is already solve by you" class="glyphicon glyphicon-ok" aria-hidden="true"></span></td><td>'.$total.'</td><td>'.$sahi*$total.'</td><td>'.$time.'&nbsp;min</td></tr>';
        }
    }
    $c=0;
    echo '</table></div></div>';
}

//ranking start
if(@$_GET['q']== 2) {
    $q=db_query($con,"SELECT * FROM rank  ORDER BY score DESC " )or die('Error223');
    echo  '<div class="panel" data-aos="fade-up"><div class="table-responsive">
    <table class="table table-striped title1" >
    <tr><td><b>Rank</b></td><td><b>Name</b></td><td><b>Gender</b></td><td><b>College</b></td><td><b>Score</b></td></tr>';
    $c=0;
    while($row=db_fetch_array($q) ) {
        $e=$row['email'];
        $s=$row['score'];
        $q12=db_query($con,"SELECT * FROM user WHERE email='$e' " )or die('Error231');
        while($row=db_fetch_array($q12) ) {
            $name=$row['name'];
            $gender=$row['gender'];
            $college=$row['college'];
        }
        $c++;
        echo '<tr><td style="color:var(--accent-orange); font-weight:bold;"><b>'.$c.'</b></td><td>'.$name.'</td><td>'.$gender.'</td><td>'.$college.'</td><td style="font-weight:bold;">'.$s.'</td></tr>';
    }
    echo '</table></div></div>';
}
?>

<!--users start-->
<?php if(@$_GET['q']==1) {
    $result = db_query($con,"SELECT * FROM user") or die('Error');
    echo  '<div class="panel" data-aos="fade-up"><div class="table-responsive"><table class="table table-striped title1">
    <tr><td><b>S.N.</b></td><td><b>Name</b></td><td><b>Gender</b></td><td><b>College</b></td><td><b>Email</b></td><td><b>Mobile</b></td><td></td></tr>';
    $c=1;
    while($row = db_fetch_array($result)) {
        $name = $row['name'];
        $mob = $row['mob'];
        $gender = $row['gender'];
        $email = $row['email'];
        $college = $row['college'];
        echo '<tr><td>'.$c++.'</td><td>'.$name.'</td><td>'.$gender.'</td><td>'.$college.'</td><td>'.$email.'</td><td>'.$mob.'</td>
        <td><a title="Delete User" href="update.php?demail='.$email.'" style="color:#ff5555;"><b><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></b></a></td></tr>';
    }
    $c=0;
    echo '</table></div></div>';
}?>

<!--feedback start-->
<?php if(@$_GET['q']==3) {
    $result = db_query($con,"SELECT * FROM `feedback` ORDER BY `feedback`.`date` DESC") or die('Error');
    echo  '<div class="panel" data-aos="fade-up"><div class="table-responsive"><table class="table table-striped title1">
    <tr><td><b>S.N.</b></td><td><b>Subject</b></td><td><b>Email</b></td><td><b>Date</b></td><td><b>Time</b></td><td><b>By</b></td><td></td><td></td></tr>';
    $c=1;
    while($row = db_fetch_array($result)) {
        $date = $row['date'];
        $date= date("d-m-Y",strtotime($date));
        $time = $row['time'];
        $subject = $row['subject'];
        $name = $row['name'];
        $email = $row['email'];
        $id = $row['id'];
         echo '<tr><td>'.$c++.'</td>';
        echo '<td><a title="Click to open feedback" href="headdash.php?q=3&fid='.$id.'" style="color:var(--accent-orange);">'.$subject.'</a></td><td>'.$email.'</td><td>'.$date.'</td><td>'.$time.'</td><td>'.$name.'</td>
        <td><a title="Open Feedback" href="headdash.php?q=3&fid='.$id.'" style="color:#55ff55;"><b><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span></b></a></td>';
        echo '<td><a title="Delete Feedback" href="update.php?fdid='.$id.'" style="color:#ff5555;"><b><span class="glyphicon glyphicon-trash" aria-hidden="true"></span></b></a></td></tr>';
    }
    echo '</table></div></div>';
}?>

<!--feedback reading portion start-->
<?php if(@$_GET['fid']) {
    echo '<br />';
    $id=@$_GET['fid'];
    $result = db_query($con,"SELECT * FROM feedback WHERE id='$id' ") or die('Error');
    while($row = db_fetch_array($result)) {
        $name = $row['name'];
        $subject = $row['subject'];
        $date = $row['date'];
        $date= date("d-m-Y",strtotime($date));
        $time = $row['time'];
        $feedback = $row['feedback'];
        
    echo '<div class="panel" data-aos="zoom-in"><a title="Back to Archive" href="headdash.php?q=3" style="color:var(--accent-orange);"><b><span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span> Back</b></a><h2 style="text-align:center; margin-top:10px;"><b>'.$subject.'</b></h2>';
     echo '<div class="mCustomScrollbar" style="margin:20px 10px; line-height:35px;"><span style="color:var(--accent-orange);"><b>DATE:</b>&nbsp;'.$date.'</span>
    <span style="color:var(--accent-orange); margin-left:15px;"><b>Time:</b>&nbsp;'.$time.'</span><span style="color:var(--accent-orange); margin-left:15px;"><b>By:</b>&nbsp;'.$name.'</span><br /><br />'.$feedback.'</div></div>';
    }
}?>

<!--add admin start-->
<?php
if(@$_GET['q']==4) {
echo ' 
<div class="row" data-aos="fade-up">
<div class="col-md-3"></div><div class="col-md-6"><div class="panel">
<h3 style="text-align:center; color:var(--text-main); margin-bottom: 30px;"><b>Enter Admin Details</b></h3>
<form class="form-horizontal title1" name="form" action="signadmin.php?q=headdash.php?q=4"  method="POST">
<fieldset>
<div class="form-group">
  <div class="col-md-12">
  <input id="email" name="email" placeholder="Enter Admin Email" class="form-control input-md" type="email">
  </div>
</div>
<div class="form-group">
  <div class="col-md-12">
  <input id="password" name="password" placeholder="Enter password" class="form-control input-md" type="password">
  </div>
</div>
<div class="form-group" style="text-align:center;">
  <div class="col-md-12"> 
    <input type="submit" class="btn btn-primary" value="Add Admin" style="width:100%;" />
  </div>
</div>
</fieldset>
</form></div></div></div>';
}
?>

<!--remove admin users start-->
<?php if(@$_GET['q']==5) {
    $result = db_query($con,"SELECT * FROM admin where role ='admin' ") or die('Error');
    echo  '<div class="panel" data-aos="fade-up"><div class="table-responsive"><table class="table table-striped title1">
    <tr><td><b>Email</b></td><td></td></tr>';
    while($row = db_fetch_array($result)) {
        $email = $row['email'];
        echo '<tr><td>'.$email.'</td>
        <td><a title="Delete User" href="update.php?demail1='.$email.'" class="btn btn-primary" style="background:#ff5555 !important;"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span> Remove</a></td></tr>';
    }
    echo '</table></div></div>';
}?>

</div></div></div>

<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
<script>AOS.init({ once: true, offset: 50, duration: 800 });</script>
</body>
</html>