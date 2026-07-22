<?php
include_once 'dbConnection.php';
$ref=@$_GET['q'];
$email = $_POST['uname'];
$password = $_POST['password'];


$result = $con->query("SELECT email FROM admin WHERE email = '$email' and password = '$password' and role = 'admin'");
$count=$result->rowCount();
if($count==1){
session_start();
if(isset($_SESSION['email'])){
session_unset();}
$_SESSION["name"] = 'Teacher';
$_SESSION["key"] ='prasanth123';
$_SESSION["email"] = $email;
header("location:dash.php?q=0");
}
else header("location:$ref?w=Warning : Access denied");
?>
<script src="js/jquery.js" type="text/javascript"></script>
<script src="js/main.js" type="text/javascript"></script>