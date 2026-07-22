<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta http-equiv="Content-Type" content="text/html; charset=iso-8859-1" />
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Dashboard</title>

<!-- Standard Bootstrap -->
<link rel="stylesheet" href="css/bootstrap.min.css"/>
<link rel="stylesheet" href="css/bootstrap-theme.min.css"/>    

<!-- Modern Premium Fonts & Icons -->
<link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;700;900&family=Inter:wght@300;400;600&display=swap" rel="stylesheet">
<link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet">

<!-- AOS Animation Library -->
<link href="https://unpkg.com/aos@2.3.1/dist/aos.css" rel="stylesheet">

<link rel="stylesheet" href="css/main.css">
<script src="js/jquery.js" type="text/javascript"></script>
<script src="js/bootstrap.min.js" type="text/javascript"></script>
<script src="js/main.js" type="text/javascript"></script>
</head>
<?php
include_once 'dbConnection.php';
$ref=@$_GET['q'];
$email = $_POST['uname'];
$password = $_POST['password'];


$result = $con->query("SELECT email FROM admin WHERE email = '$email' and password = '$password' and role = 'head'");
$count=$result->rowCount();
if($count==1){
session_start();
if(isset($_SESSION['email'])){
session_unset();}
$_SESSION["name"] = 'Admin';
$_SESSION["key"] ='prasanth123';
$_SESSION["email"] = $email;
header("location:headdash.php?q=0");
}
else header("location:$ref?w=Warning : Access denied");
?>