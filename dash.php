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
<title>Online Examiner - Teacher</title>

<link rel="stylesheet" href="css/bootstrap.min.css"/>
<link rel="stylesheet" href="css/bootstrap-theme.min.css"/>    
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">
<link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">

<script src="js/jquery.js" type="text/javascript"></script>
<script src="js/bootstrap.min.js" type="text/javascript"></script>

<style>
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
select.form-control option { background: #111; color: #fff; }
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
      <a class="navbar-brand" href="dash.php?q=0">
        <i class="material-icons" style="color:var(--accent-orange);">bubble_chart</i>
        <span class="main-text">e-Examiner</span>
        <span class="sub-text">| Teacher Dashboard</span>
      </a>
    </div>
    <div class="collapse navbar-collapse" id="main-nav">
      <ul class="nav navbar-nav" style="margin-left: 30px;">
        <li <?php if(@$_GET['q']==0) echo'class="active"'; ?>><a href="dash.php?q=0">Home</a></li>
        <li <?php if(@$_GET['q']==1) echo'class="active"'; ?>><a href="dash.php?q=1">Scores</a></li>  
        <li <?php if(@$_GET['q']==2) echo'class="active"'; ?>><a href="dash.php?q=2">Ranking</a></li>
        <li class="dropdown <?php if(@$_GET['q']==4 || @$_GET['q']==5) echo'active'; ?>">
          <a href="#" class="dropdown-toggle" data-toggle="dropdown" role="button" aria-haspopup="true" aria-expanded="false">Quiz <span class="caret"></span></a>
          <ul class="dropdown-menu">
            <li><a href="dash.php?q=4">Add Quiz</a></li>
            <li><a href="dash.php?q=5">Remove Quiz</a></li>
          </ul>
        </li>
      </ul>
      <ul class="nav navbar-nav navbar-right">
        <li><a href="#" style="cursor:default;">Welcome, <span style="color:var(--accent-orange);"><?php echo $name; ?></span></a></li>
        <li class="logout-pill"><a href="logout.php?q=dash.php"><i class="material-icons" style="font-size:16px; vertical-align:middle;">logout</i> Signout</a></li>
      </ul>
    </div>
  </div>
</nav>

<div class="container">
<div class="row">
<div class="col-md-12">

<!--home start-->
<?php if(@$_GET['q']==0) {
    $result = mysqli_query($con,"SELECT * FROM quiz where email='$email' ORDER BY date DESC") or die('Error');
    echo  '<div class="panel" data-aos="fade-up"><div class="table-responsive"><table class="table table-striped title1">
    <tr><td><b>S.N.</b></td><td><b>Topic</b></td><td><b>Total question</b></td><td><b>Marks</b></td><td><b>positive</b></td><td><b>negative</b></td><td><b>Time limit</b></td><td></td></tr>';
    $c=1;
    while($row = mysqli_fetch_array($result)) {
        $title = $row['title'];
        $total = $row['total'];
        $sahi = $row['sahi'];
        $wrong = $row['wrong'];
        $time = $row['time'];
        $eid = $row['eid'];
        $q12=mysqli_query($con,"SELECT score FROM history WHERE eid='$eid' AND email='$email'" )or die('Error98');
        $rowcount=mysqli_num_rows($q12);	
        if($rowcount == 0){
            echo '<tr><td>'.$c++.'</td><td>'.$title.'</td><td>'.$total.'</td><td>'.$sahi*$total.'</td><td>'.$sahi.'</td><td>'.$wrong.'</td><td>'.$time.'&nbsp;min</td></tr>';
        } else {
            echo '<tr style="color:var(--accent-orange);"><td>'.$c++.'</td><td>'.$title.'&nbsp;<span title="This quiz is already solve by you" class="glyphicon glyphicon-ok" aria-hidden="true"></span></td><td>'.$total.'</td><td>'.$sahi*$total.'</td><td>'.$time.'&nbsp;min</td></tr>';
        }
    }
    $c=0;
    echo '</table></div></div>';
}

//score details
if(@$_GET['q']== 1) {
  $q=mysqli_query($con,"SELECT distinct q.title,u.name,u.college,h.score,h.date from user u,history h,quiz q where q.email='$email' and q.eid=h.eid and h.email=u.email order by q.eid DESC")or die('Error197');
    echo  '<div class="panel" data-aos="fade-up"><div class="table-responsive">
    <table class="table table-striped title1" >
    <tr><td><b>S.N.</b></td><td><b>Title</b></td><td><b>Name</b></td><td><b>College</b></td><td><b>Score<b></td><td><b>Date</b></td>';
    $c=0;
    while($row=mysqli_fetch_array($q) ) {
        $title=$row['title'];
        $name=$row['name'];
        $college=$row['college'];
        $score=$row['score'];
        $date=$row['date'];
        echo '<tr><td>'.$c++.'</td><td>'.$title.'</td><td>'.$name.'</td><td>'.$college.'</td><td style="color:var(--accent-orange); font-weight:bold;">'.$score.'</td><td>'.$date.'</td></tr>';
    }
    echo'</table></div></div>';
}

//ranking start
if(@$_GET['q']== 2) {
    $q=mysqli_query($con,"SELECT * FROM rank  ORDER BY score DESC " )or die('Error223');
    echo  '<div class="panel" data-aos="fade-up"><div class="table-responsive">
    <table class="table table-striped title1" >
    <tr><td><b>Rank</b></td><td><b>Name</b></td><td><b>Gender</b></td><td><b>College</b></td><td><b>Score</b></td></tr>';
    $c=0;
    while($row=mysqli_fetch_array($q) ) {
        $e=$row['email'];
        $s=$row['score'];
        $q12=mysqli_query($con,"SELECT * FROM user WHERE email='$e' " )or die('Error231');
        while($row=mysqli_fetch_array($q12) ) {
            $name=$row['name'];
            $gender=$row['gender'];
            $college=$row['college'];
        }
        $c++;
        echo '<tr><td style="color:var(--accent-orange); font-weight:bold;"><b>'.$c.'</b></td><td>'.$name.'</td><td>'.$gender.'</td><td>'.$college.'</td><td style="font-weight:bold;">'.$s.'</td></tr>';
    }
    echo '</table></div></div>';
}

//add quiz start
if(@$_GET['q']==4 && !(@$_GET['step']) ) {
echo ' 
<div class="row" data-aos="fade-up">
<div class="col-md-3"></div><div class="col-md-6">
<div class="panel">
<h3 style="text-align:center; color:var(--text-main); margin-bottom: 30px;"><b>Enter Quiz Details</b></h3>
<form class="form-horizontal title1" name="form" action="update.php?q=addquiz"  method="POST">
<fieldset>
<div class="form-group">
  <div class="col-md-12">
  <input id="name" name="name" placeholder="Enter Quiz title" class="form-control input-md" type="text">
  </div>
</div>
<div class="form-group">
  <div class="col-md-12">
  <input id="total" name="total" placeholder="Enter total number of questions" class="form-control input-md" type="number">
  </div>
</div>
<div class="form-group">
  <div class="col-md-12">
  <input id="right" name="right" placeholder="Enter marks on right answer" class="form-control input-md" min="0" type="number">
  </div>
</div>
<div class="form-group">
  <div class="col-md-12">
  <input id="wrong" name="wrong" placeholder="Enter minus marks on wrong answer without sign" class="form-control input-md" min="0" type="number">
  </div>
</div>
<div class="form-group">
  <div class="col-md-12">
  <input id="time" name="time" placeholder="Enter time limit for test in minute" class="form-control input-md" min="1" type="number">
  </div>
</div>
<div class="form-group">
  <div class="col-md-12">
  <input id="tag" name="tag" placeholder="Enter #tag which is used for searching" class="form-control input-md" type="text">
  </div>
</div>
<div class="form-group">
  <div class="col-md-12">
  <textarea rows="4" name="desc" class="form-control" placeholder="Write description here..."></textarea>  
  </div>
</div>
<div class="form-group" style="text-align:center;">
  <div class="col-md-12"> 
    <input type="submit" class="btn btn-primary" value="Submit Quiz" style="width:100%;" />
  </div>
</div>
</fieldset>
</form></div></div></div>';
}

//add quiz step2 start
if(@$_GET['q']==4 && (@$_GET['step'])==2 ) {
echo ' 
<div class="row" data-aos="fade-up">
 <div class="col-md-3"></div><div class="col-md-6"><div class="panel">
 <h3 style="text-align:center; color:var(--text-main); margin-bottom: 30px;"><b>Enter Question Details</b></h3>
 <form class="form-horizontal title1" name="form" action="update.php?q=addqns&n='.@$_GET['n'].'&eid='.@$_GET['eid'].'&ch=4 "  method="POST">
<fieldset>
';
 for($i=1;$i<=@$_GET['n'];$i++) {
echo '<h4 style="color:var(--accent-orange);">Question '.$i.'</h4>
<div class="form-group">
  <div class="col-md-12">
  <textarea rows="3" name="qns'.$i.'" class="form-control" placeholder="Write question number '.$i.' here..."></textarea>  
  </div>
</div>
<div class="form-group">
  <div class="col-md-12">
  <input id="'.$i.'1" name="'.$i.'1" placeholder="Enter option a" class="form-control input-md" type="text">
  </div>
</div>
<div class="form-group">
  <div class="col-md-12">
  <input id="'.$i.'2" name="'.$i.'2" placeholder="Enter option b" class="form-control input-md" type="text">
  </div>
</div>
<div class="form-group">
  <div class="col-md-12">
  <input id="'.$i.'3" name="'.$i.'3" placeholder="Enter option c" class="form-control input-md" type="text">
  </div>
</div>
<div class="form-group">
  <div class="col-md-12">
  <input id="'.$i.'4" name="'.$i.'4" placeholder="Enter option d" class="form-control input-md" type="text">
  </div>
</div>
<br />
<b>Correct answer</b>:<br />
<select id="ans'.$i.'" name="ans'.$i.'" class="form-control input-md" >
   <option value="a">Select correct option</option>
  <option value="a">option a</option>
  <option value="b">option b</option>
  <option value="c">option c</option>
  <option value="d">option d</option> </select><br /><hr />'; 
 }
echo '<div class="form-group" style="text-align:center;">
  <div class="col-md-12"> 
    <input type="submit" class="btn btn-primary" value="Submit Questions" style="width:100%;" />
  </div>
</div>
</fieldset>
</form></div></div></div>';
}

//remove quiz
if(@$_GET['q']==5) {
    $result = mysqli_query($con,"SELECT * FROM quiz where email='$email' ORDER BY date DESC") or die('Error');
    echo  '<div class="panel" data-aos="fade-up"><div class="table-responsive"><table class="table table-striped title1">
    <tr><td><b>S.N.</b></td><td><b>Topic</b></td><td><b>Total question</b></td><td><b>Marks</b></td><td><b>Time limit</b></td><td></td></tr>';
    $c=1;
    while($row = mysqli_fetch_array($result)) {
        $title = $row['title'];
        $total = $row['total'];
        $sahi = $row['sahi'];
        $time = $row['time'];
        $eid = $row['eid'];
        echo '<tr><td>'.$c++.'</td><td>'.$title.'</td><td>'.$total.'</td><td>'.$sahi*$total.'</td><td>'.$time.'&nbsp;min</td>
        <td><b><a href="update.php?q=rmquiz&eid='.$eid.'" class="btn btn-primary" style="background:#ff5555 !important;"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span> Remove</a></b></td></tr>';
    }
    $c=0;
    echo '</table></div></div>';
}
?>

</div></div></div>

<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
<script>AOS.init({ once: true, offset: 50, duration: 800 });</script>
</body>
</html>