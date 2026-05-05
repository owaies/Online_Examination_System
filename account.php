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
<title>Online Examiner - Student</title>

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
    padding-top: 80px; /* Fixes overlap with fixed navbar */
}

h1, h2, h3, h4, h5, h6, .title, .title1 {
    font-family: var(--font-heading) !important;
    color: var(--text-main) !important;
}

/* Unified Navbar */
.navbar-default {
    background: rgba(15, 15, 15, 0.95) !important;
    backdrop-filter: blur(10px) !important;
    border: none !important;
    border-bottom: 1px solid rgba(255,255,255,0.05) !important;
    padding: 10px 0;
}
.navbar-brand { 
    display: flex; align-items: center; gap: 10px;
}
.navbar-brand span.main-text { font-family: var(--font-heading); font-weight: 900; font-size: 24px; color: var(--text-main); }
.navbar-brand span.sub-text { font-size: 14px; color: var(--text-muted); font-weight: 400; margin-left: 5px; }

.navbar-default .navbar-nav > li > a { 
    color: var(--text-main) !important; font-weight: 600; text-transform: uppercase; font-size: 13px; letter-spacing: 1px; 
}
.navbar-default .navbar-nav > .active > a, .navbar-default .navbar-nav > li > a:hover { 
    background-color: transparent !important; color: var(--accent-orange) !important; 
}

/* Logout Button */
.logout-pill > a {
    background: var(--accent-orange) !important;
    color: #000 !important;
    border-radius: 50px !important;
    padding: 6px 20px !important;
    margin-top: 10px;
    margin-left: 15px;
    transition: all 0.3s ease;
}
.logout-pill > a:hover {
    background: var(--accent-hover) !important;
    transform: translateY(-2px);
    box-shadow: 0 5px 15px rgba(232, 93, 34, 0.3);
}

/* Panels & Tables */
.panel {
    background-color: rgba(15, 15, 15, 0.95) !important;
    backdrop-filter: blur(20px);
    border: 1px solid rgba(255,255,255,0.1) !important;
    border-radius: 16px !important;
    box-shadow: 0 20px 40px rgba(0,0,0,0.8) !important;
    padding: 40px;
    margin-bottom: 40px;
    color: var(--text-main) !important;
}

.table { color: var(--text-muted) !important; margin-bottom: 0; }
.table > tbody > tr > td, .table > tbody > tr > th {
    border-top: 1px solid rgba(255,255,255,0.05) !important;
    vertical-align: middle;
    padding: 15px 8px;
}
.table-striped > tbody > tr:nth-of-type(odd) { background-color: rgba(255, 255, 255, 0.02) !important; }
.table-striped > tbody > tr:hover { background-color: rgba(255, 255, 255, 0.05) !important; }
tr td b { color: var(--text-main) !important; }

/* Buttons & Inputs */
.btn-primary, .sub1 {
    background: var(--accent-orange) !important; color: #000 !important;
    border-radius: 50px !important; padding: 12px 30px !important; font-weight: 700 !important; border: none !important;
    transition: all 0.3s ease !important;
}
.btn-primary:hover, .sub1:hover {
    background: var(--accent-hover) !important; transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(232, 93, 34, 0.3) !important; text-decoration: none;
}
.form-control {
    background-color: rgba(0,0,0,0.5) !important; color: #ffffff !important;
    border: 1px solid rgba(255,255,255,0.1) !important; border-radius: 12px !important; padding: 12px 15px !important; height: auto !important;
}
.form-control:focus { border-color: var(--accent-orange) !important; box-shadow: 0 0 0 2px rgba(232, 93, 34, 0.2) !important; }

/* ==========================================================================
   ENHANCED QUIZ OPTIONS STYLING
   ========================================================================== */
.option-wrapper {
    position: relative;
    margin-bottom: 15px;
}
.option-wrapper input[type="radio"] {
    position: absolute; opacity: 0; cursor: pointer; height: 0; width: 0;
}
.option-card {
    display: flex; align-items: center; padding: 18px 25px;
    background: rgba(255,255,255,0.02); border: 1px solid rgba(255,255,255,0.05);
    border-radius: 12px; cursor: pointer;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    margin: 0;
    width: 100%;
}
.option-card:hover {
    background: rgba(255,255,255,0.05); border-color: rgba(255,255,255,0.2);
    transform: translateX(8px);
}
.option-letter {
    display: flex; align-items: center; justify-content: center;
    width: 38px; height: 38px; border-radius: 8px; 
    background: rgba(255,255,255,0.08); font-weight: 700; color: var(--text-main);
    margin-right: 20px; transition: all 0.3s ease; flex-shrink: 0;
    font-family: var(--font-heading);
}
.option-text { 
    font-size: 16px; color: var(--text-muted); font-weight: 400; transition: all 0.3s ease;
}

/* Checked State - Bold & Spicy selection */
.option-wrapper input[type="radio"]:checked + .option-card {
    background: rgba(232, 93, 34, 0.08);
    border-color: var(--accent-orange);
    box-shadow: 0 5px 25px rgba(232, 93, 34, 0.15);
    transform: translateX(12px);
}
.option-wrapper input[type="radio"]:checked + .option-card .option-letter {
    background: var(--accent-orange);
    color: #000;
    box-shadow: 0 4px 15px rgba(232, 93, 34, 0.4);
}
.option-wrapper input[type="radio"]:checked + .option-card .option-text {
    color: #fff;
    font-weight: 600;
}
</style>
<?php if(@$_GET['w']) {echo'<script>alert("'.@$_GET['w'].'");</script>';} ?>
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
      <a class="navbar-brand" href="account.php?q=1">
        <i class="material-icons" style="color:var(--accent-orange);">bubble_chart</i>
        <span class="main-text">e-Examiner</span>
        <span class="sub-text">| Student Dashboard</span>
      </a>
    </div>
    <div class="collapse navbar-collapse" id="main-nav">
      <ul class="nav navbar-nav" style="margin-left: 30px;">
        <li <?php if(@$_GET['q']==1) echo'class="active"'; ?>><a href="account.php?q=1">Home</a></li>
        <li <?php if(@$_GET['q']==2) echo'class="active"'; ?>><a href="account.php?q=2">History</a></li>
        <li <?php if(@$_GET['q']==3) echo'class="active"'; ?>><a href="account.php?q=3">Ranking</a></li>
      </ul>
      <ul class="nav navbar-nav navbar-right">
        <li><a href="#" style="cursor:default;">Welcome, <span style="color:var(--accent-orange); text-transform:uppercase; font-weight:700;"><?php echo $name; ?></span></a></li>
        <li class="logout-pill"><a href="logout.php?q=account.php"><i class="material-icons" style="font-size:16px; vertical-align:middle;">logout</i> Signout</a></li>
      </ul>
    </div>
  </div>
</nav>

<div class="container">
<div class="row">
<div class="col-md-12">

<!--home start-->
<?php if(@$_GET['q']==1) {
    $result = mysqli_query($con,"SELECT * FROM quiz ORDER BY date DESC") or die('Error');
    echo  '<div class="panel" data-aos="fade-up"><div class="table-responsive"><table class="table table-striped title1">
    <tr><td><b>S.N.</b></td><td><b>Topic</b></td><td><b>Total question</b></td><td><b>Marks</b></td><td><b>positive</b></td><td><b>negative</b></td><td><b>Time limit</b></td><td></td><td></td></tr>';
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
            echo '<tr><td>'.$c++.'</td><td>'.$title.'</td><td>'.$total.'</td><td>'.$sahi*$total.'</td><td>'.$sahi.'</td><td>'.$wrong.'</td><td>'.$time.'&nbsp;min</td>
            <td><a title="Open quiz description" href="account.php?q=1&fid='.$eid.'" style="color:var(--accent-orange);"><b><span class="glyphicon glyphicon-folder-open" aria-hidden="true"></span></b></a></td>
            <td><b><a href="account.php?q=quiz&step=2&eid='.$eid.'&n=1&t='.$total.'" class="btn sub1"><b>Start</b></a></b></td></tr>';
        } else {
            echo '<tr><td>'.$c++.'</td><td style="color:var(--accent-orange);">'.$title.'&nbsp;<span title="This quiz is already solve by you" class="glyphicon glyphicon-ok" aria-hidden="true"></span></td><td>'.$total.'</td><td>'.$sahi*$total.'</td><td>'.$sahi.'</td><td>'.$wrong.'</td><td>'.$time.'&nbsp;min</td><td></td><td></td></tr>';
        }
    }
    $c=0;
    echo '</table></div></div>';
}?>

<!-- Quiz reading portion starts -->
<?php if(@$_GET['fid']) {
    $eid=@$_GET['fid'];
    $result = mysqli_query($con,"SELECT * FROM quiz WHERE eid='$eid' ") or die('Error');
    while($row = mysqli_fetch_array($result)) {
        $title = $row['title'];
        $date = $row['date'];
        $date= date("d-m-Y",strtotime($date));
        $intro = $row['intro'];
        echo '<div class="panel" data-aos="zoom-in"><a title="Back to Archive" href="account.php?q=1" style="color:var(--accent-orange);"><b><span class="glyphicon glyphicon-arrow-left" aria-hidden="true"></span> Back</b></a><h2 style="text-align:center; margin-top:10px;"><b>'.$title.'</b></h2>';
        echo '<div class="mCustomScrollbar" style="margin:20px 10px; line-height:35px;"><span style="color:var(--accent-orange);"><b>DATE:</b>&nbsp;'.$date.'</span><br /><br />'.$intro.'</div></div>';
    }
}?>

<!-- Quiz start -->
<?php
if(@$_GET['q']== 'quiz' && @$_GET['step']== 2) {
    $eid=@$_GET['eid'];
    $sn=@$_GET['n'];
    $total=@$_GET['t'];
    $q=mysqli_query($con,"SELECT * FROM questions WHERE eid='$eid' AND sn='$sn' " );
    
    echo '<div class="panel" style="max-width: 900px; margin: 0 auto;" data-aos="fade-right">';
    
    // Display Question
    while($row=mysqli_fetch_array($q) ) {
        $qns=$row['qns'];
        $qid=$row['qid'];
        echo '<h3 style="font-family: var(--font-heading); font-size: 28px; font-weight: 700; margin-bottom: 10px;">Question '.$sn.'</h3>
              <p style="font-size: 18px; color: var(--text-main); font-weight: 600; margin-bottom: 30px;">'.$qns.'</p>';
    }
    
    $q=mysqli_query($con,"SELECT * FROM options WHERE qid='$qid' " );
    echo '<form action="update.php?q=quiz&step=2&eid='.$eid.'&n='.$sn.'&t='.$total.'&qid='.$qid.'" method="POST" class="form-horizontal">';
    
    // Array to generate A, B, C, D labels
    $letters = ['A', 'B', 'C', 'D', 'E', 'F'];
    $opt_index = 0;
    $delay = 100; // Delay for animation staggering
    
    // Display Options
    while($row=mysqli_fetch_array($q) ) {
        $option=$row['option'];
        $optionid=$row['optionid'];
        $current_letter = isset($letters[$opt_index]) ? $letters[$opt_index] : ($opt_index + 1);
        
        // The entire block is now a clickable label connected to an invisible radio input
        echo '
        <div class="option-wrapper" data-aos="fade-up" data-aos-delay="'.$delay.'">
            <input type="radio" name="ans" id="opt_'.$optionid.'" value="'.$optionid.'" required>
            <label class="option-card" for="opt_'.$optionid.'">
                <span class="option-letter">'.$current_letter.'</span>
                <span class="option-text">'.$option.'</span>
            </label>
        </div>';
        
        $opt_index++;
        $delay += 100; // Stagger animations by 100ms
    }
    
    echo'<br /><button type="submit" class="btn btn-primary" data-aos="zoom-in" data-aos-delay="'.$delay.'" style="margin-top: 15px;">Submit Answer</button></form></div>';
}

// Result display
if(@$_GET['q']== 'result' && @$_GET['eid']) {
    $eid=@$_GET['eid'];
    $q=mysqli_query($con,"SELECT * FROM history WHERE eid='$eid' AND email='$email' " )or die('Error157');
    echo  '<div class="panel" data-aos="zoom-in"><center><h1 class="title" style="color:var(--accent-orange);">Result</h1><center><br /><div class="table-responsive"><table class="table table-striped title1" style="font-size:20px;font-weight:700;">';
    while($row=mysqli_fetch_array($q) ) {
        $s=$row['score'];
        $w=$row['wrong'];
        $r=$row['sahi'];
        $qa=$row['level'];
        echo '<tr><td>Total Questions</td><td>'.$qa.'</td></tr>
              <tr><td style="color:#55ff55;">Right Answer</td><td><span style="color:#55ff55;">'.$r.'</span></td></tr> 
              <tr><td style="color:#ff5555;">Wrong Answer</td><td><span style="color:#ff5555;">'.$w.'</span></td></tr>
              <tr><td style="color:var(--accent-orange);">Score</td><td><span style="color:var(--accent-orange);">'.$s.'</span></td></tr>';
    }
    $q=mysqli_query($con,"SELECT * FROM rank WHERE email='$email' " )or die('Error157');
    while($row=mysqli_fetch_array($q) ) {
        $s=$row['score'];
        echo '<tr><td>Overall Score</td><td>'.$s.'</td></tr>';
    }
    echo '</table></div></div>';
}
?>

<!-- History start -->
<?php
if(@$_GET['q']== 2) {
    $q=mysqli_query($con,"SELECT * FROM history WHERE email='$email' ORDER BY date DESC " )or die('Error197');
    echo  '<div class="panel" data-aos="fade-up"><div class="table-responsive"><table class="table table-striped title1" >
    <tr><td><b>S.N.</b></td><td><b>Quiz</b></td><td><b>Question Solved</b></td><td><b>Right</b></td><td><b>Wrong<b></td><td><b>Score</b></td>';
    $c=0;
    while($row=mysqli_fetch_array($q) ) {
        $eid=$row['eid'];
        $s=$row['score'];
        $w=$row['wrong'];
        $r=$row['sahi'];
        $qa=$row['level'];
        $q23=mysqli_query($con,"SELECT title FROM quiz WHERE eid='$eid' " )or die('Error208');
        while($row=mysqli_fetch_array($q23) ) { $title=$row['title']; }
        $c++;
        echo '<tr><td>'.$c.'</td><td>'.$title.'</td><td>'.$qa.'</td><td style="color:#55ff55;">'.$r.'</td><td style="color:#ff5555;">'.$w.'</td><td style="color:var(--accent-orange); font-weight:bold;">'.$s.'</td></tr>';
    }
    echo'</table></div></div>';
}

// Ranking start
if(@$_GET['q']== 3) {
    $q=mysqli_query($con,"SELECT * FROM rank ORDER BY score DESC " )or die('Error223');
    echo  '<div class="panel" data-aos="fade-up"><div class="table-responsive"><table class="table table-striped title1" >
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
?>
</div></div></div>

<script src="https://unpkg.com/aos@2.3.1/dist/aos.js"></script>
<script>AOS.init({ once: true, offset: 50, duration: 800 });</script>
</body>
</html>