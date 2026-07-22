<?php
include_once 'dbConnection.php';
session_start();
$email=$_SESSION['email'];
//delete feedback
if(isset($_SESSION['key'])){
if(@$_GET['fdid'] && $_SESSION['key']=='prasanth123') {
$id=@$_GET['fdid'];
$result = $con->query("DELETE FROM feedback WHERE id='$id' ");
header("location:headdash.php?q=3");
}
}

//delete user
if(isset($_SESSION['key'])){
if(@$_GET['demail'] && $_SESSION['key']=='prasanth123') {
$demail=@$_GET['demail'];
$r1 = $con->query("DELETE FROM rank WHERE email='$demail' ");
$r2 = $con->query("DELETE FROM history WHERE email='$demail' ");
$result = $con->query("DELETE FROM \"user\" WHERE email='$demail' ");
header("location:headdash.php?q=1");
}
}

//delete admin

if(isset($_SESSION['key'])){
if(@$_GET['demail1'] && $_SESSION['key']=='prasanth123') {
$demail1=@$_GET['demail1'];

$result = $con->query("DELETE FROM admin WHERE email='$demail1' and role ='admin' ");
header("location:headdash.php?q=5");
}
}



//remove quiz
if(isset($_SESSION['key'])){
if(@$_GET['q']== 'rmquiz' && $_SESSION['key']=='prasanth123') {
$eid=@$_GET['eid'];
$result = $con->query("SELECT * FROM questions WHERE eid='$eid'");
while($row = $result->fetch()) {
	$qid = $row['qid'];
$r1 = $con->query("DELETE FROM options WHERE qid='$qid'");
$r2 = $con->query("DELETE FROM answer WHERE qid='$qid' ");
}
$r3 = $con->query("DELETE FROM questions WHERE eid='$eid' ");
$r4 = $con->query("DELETE FROM quiz WHERE eid='$eid' ");
$r4 = $con->query("DELETE FROM history WHERE eid='$eid' ");

header("location:dash.php?q=5");
}
}

//add quiz
if(isset($_SESSION['key'])){
if(@$_GET['q']== 'addquiz' && $_SESSION['key']=='prasanth123') {
$name = $_POST['name'];
$name= ucwords(strtolower($name));
$total = $_POST['total'];
$sahi = $_POST['right'];
$wrong = $_POST['wrong'];
$time = $_POST['time'];
$tag = $_POST['tag'];
$desc = $_POST['desc'];
$id=uniqid();
$q3=$con->query("INSERT INTO quiz VALUES  ('$id','$name' , '$sahi' , '$wrong','$total','$time' ,'$desc','$tag', NOW() ,'$email')");

header("location:dash.php?q=4&step=2&eid=$id&n=$total");
}
}

//add question
if(isset($_SESSION['key'])){
if(@$_GET['q']== 'addqns' && $_SESSION['key']=='prasanth123') {
$n=@$_GET['n'];
$eid=@$_GET['eid'];
$ch=@$_GET['ch'];

for($i=1;$i<=$n;$i++)
 {
 $qid=uniqid();
 $qns=$_POST['qns'.$i];
$q3=$con->query("INSERT INTO questions VALUES  ('$eid','$qid','$qns' , '$ch' , '$i')");
  $oaid=uniqid();
  $obid=uniqid();
$ocid=uniqid();
$odid=uniqid();
$a=$_POST[$i.'1'];
$b=$_POST[$i.'2'];
$c=$_POST[$i.'3'];
$d=$_POST[$i.'4'];
$qa=$con->query("INSERT INTO options VALUES  ('$qid','$a','$oaid')");
$qb=$con->query("INSERT INTO options VALUES  ('$qid','$b','$obid')");
$qc=$con->query("INSERT INTO options VALUES  ('$qid','$c','$ocid')");
$qd=$con->query("INSERT INTO options VALUES  ('$qid','$d','$odid')");
$e=$_POST['ans'.$i];
switch($e)
{
case 'a':
$ansid=$oaid;
break;
case 'b':
$ansid=$obid;
break;
case 'c':
$ansid=$ocid;
break;
case 'd':
$ansid=$odid;
break;
default:
$ansid=$oaid;
}


$qans=$con->query("INSERT INTO answer VALUES  ('$qid','$ansid')");

 }
header("location:dash.php?q=0");
}
}

//quiz start
if(@$_GET['q']== 'quiz' && @$_GET['step']== 2) {
$eid=@$_GET['eid'];
$sn=@$_GET['n'];
$total=@$_GET['t'];
$ans=$_POST['ans'];
$qid=@$_GET['qid'];
$q=$con->query("SELECT * FROM answer WHERE qid='$qid' ");
while($row = $q->fetch())
{
$ansid=$row['ansid'];
}
if($ans == $ansid)
{
$q=$con->query("SELECT * FROM quiz WHERE eid='$eid' ");
while($row = $q->fetch())
{
$sahi=$row['sahi'];
}
if($sn == 1)
{
$q=$con->query("INSERT INTO history VALUES('$email','$eid' ,'0','0','0','0',NOW())");
}
$q=$con->query("SELECT * FROM history WHERE eid='$eid' AND email='$email' ");

while($row = $q->fetch())
{
$s=$row['score'];
$r=$row['sahi'];
}
$r++;
$s=$s+$sahi;
$q=$con->query("UPDATE \"history\" SET \"score\"=$s,\"level\"=$sn,\"sahi\"=$r, date= NOW()  WHERE  email = '$email' AND eid = '$eid'");

} 
else
{
$q=$con->query("SELECT * FROM quiz WHERE eid='$eid' ");

while($row = $q->fetch())
{
$wrong=$row['wrong'];
}
if($sn == 1)
{
$q=$con->query("INSERT INTO history VALUES('$email','$eid' ,'0','0','0','0',NOW() )");
}
$q=$con->query("SELECT * FROM history WHERE eid='$eid' AND email='$email' ");
while($row = $q->fetch())
{
$s=$row['score'];
$w=$row['wrong'];
}
$w++;
$s=$s-$wrong;
$q=$con->query("UPDATE \"history\" SET \"score\"=$s,\"level\"=$sn,\"wrong\"=$w, date=NOW() WHERE  email = '$email' AND eid = '$eid'");
}
if($sn != $total)
{
$sn++;
header("location:account.php?q=quiz&step=2&eid=$eid&n=$sn&t=$total")or die('Error152');
}
else if( $_SESSION['key']!='prasanth123')
{
$q=$con->query("SELECT score FROM history WHERE eid='$eid' AND email='$email'");
while($row = $q->fetch())
{
$s=$row['score'];
}
$q=$con->query("SELECT * FROM rank WHERE email='$email'");
$rowcount=$q->rowCount();
if($rowcount == 0)
{
$q2=$con->query("INSERT INTO rank VALUES('$email','$s',NOW())");
}
else
{
while($row = $q->fetch())
{
$sun=$row['score'];
}
$sun=$s+$sun;
$q=$con->query("UPDATE \"rank\" SET \"score\"=$sun ,time=NOW() WHERE email= '$email'");
}
header("location:account.php?q=result&eid=$eid");
}
else
{
header("location:account.php?q=result&eid=$eid");
}
}

//restart quiz
if(@$_GET['q']== 'quizre' && @$_GET['step']== 25 ) {
$eid=@$_GET['eid'];
$n=@$_GET['n'];
$t=@$_GET['t'];
$q=$con->query("SELECT score FROM history WHERE eid='$eid' AND email='$email'");
while($row = $q->fetch())
{
$s=$row['score'];
}
$q=$con->query("DELETE FROM \"history\" WHERE eid='$eid' AND email='$email' ");
$q=$con->query("SELECT * FROM rank WHERE email='$email'");
while($row = $q->fetch())
{
$sun=$row['score'];
}
$sun=$sun-$s;
$q=$con->query("UPDATE \"rank\" SET \"score\"=$sun ,time=NOW() WHERE email= '$email'");
header("location:account.php?q=quiz&step=2&eid=$eid&n=1&t=$t");
}



?>



