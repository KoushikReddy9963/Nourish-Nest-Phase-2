import express from "express";
import mongoose from "mongoose";
import path from "path";
import session from "express-session";
import axios from "axios";
import { fileURLToPath } from "url";
import { signUp, logIn, deleteUser , getNourishusers } from "../Model/mongodb.js";
import {addFeedback, getAllFeedbacks, deleteFeedback } from "../Model/feedback.js";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";

const __filename = fileURLToPath(import.meta.url);
console.log(__filename);
const __dirname = path.dirname(__filename);
console.log(__dirname);

const app = express();

app.set('views', path.join(process.cwd(), 'views'));
app.set('view engine', 'ejs'); 

app.use(express.static(path.join(__dirname, "../../public")));
app.use(express.urlencoded({ extended: true }));

app.use(cookieParser());
app.use(bodyParser.json());

app.use(
    session({
        secret: "123",
        resave: false,
        saveUninitialized: true,
        cookie: {
            secure: false,
            maxAge: 900000
        },
    })
);

const db_url = process.env.MONGODB_URL || "mongodb+srv://Koushik:1234@koushik.xbrofez.mongodb.net/NourishNest";
const connectDB = async (url) => {
    try {
        await mongoose.connect(url);
        console.log("DB connected");
    } catch (error) {
        console.log(error);
    }
};
connectDB(db_url);

app.get("/", (req, res, next) => {
    res.redirect("/index?role=guest");
}).get("/index", (req, res) => {
    const role = req.query.role || 'guest';
    const Firstname = (role === 'guest') ? "Guest" : req.session.user;
    console.log(role);
    res.render("index", { Firstname });
});

app.get("/index&role=user", (req, res) => {
    const Firstname = req.session.user;
    console.log(Firstname);
    res.render("index", { Firstname });
});


app.get("/login", (req, res) => {
    if (req.session.isAuthenticated) {
        res.send("Already Logged In");
    } else {
        res.render("login");
    }
});

app.get("/nourish", (req, res, next) => {
    if (req.session.isAuthenticated) {
        res.redirect("/nourish&role=user");
    } else {
        res.redirect("/nourish&role=guest");
    }
});

app.get("/nourish&role=user", (req, res) => {
    res.render("nourish", { isAuthenticated: req.session.isAuthenticated });
});

app.get("/nourish&role=guest", (req, res) => {
    res.render("nourish", { isAuthenticated: req.session.isAuthenticated });
});



app.get("/about", (req, res, next) => {
    if (req.session.isAuthenticated) {
        res.redirect("/about&role=user");
    } else {
        res.redirect("/about&role=guest");
    }
});

app.get("/about&role=user", (req, res) => {
    res.render("about");
});

app.get("/about&role=guest", (req, res) => {
    res.render("about");
    
});



app.post("/login", async (req, res, next) => {
    const { email, password } = req.body;
    try {
        const loginResult = await logIn(email, password);
        if (loginResult.success) {
            console.log("You have successfully logged in");
            req.session.user = loginResult.message;
            req.session.isAuthenticated = true;

            console.log(req.session.user);
            res.redirect("/index?role=user");
        } else {
            console.log(loginResult.message);
            res.status(400).send("Invalid email or password");
        }
    } catch (error) {
        console.error("An error occurred while logging in:", error);
        res.status(500).send("An error occurred while logging in");
    }
});


app.post("/signup", async (req, res, next) => {
    const { Firstname, Lastname, email, password, role } = req.body;
    try {
        const result = await signUp(Firstname, Lastname, email, password, role);
        if (result.success) {
            req.session.user = Firstname;
            console.log(req.session.user);
            req.session.isAuthenticated = true;
            res.redirect("/index&role=user");
        } else {
            res.send(result.message);
        }
    } catch (error) {
        console.error("Error signing up:", error);
        res.status(500).send("An error occurred while signing up.");
    }
});

app.post("/about", async (req, res) => {
    const { name, email, message } = req.body;
    try {
        const result = await addFeedback(name, email, message);
        if (result.success) {
            res.json(req.body);
        } else {
            res.send(result.message);
        }
    } catch (error) {
        console.error("Error:", error);
        res.status(500).send("An error occurred.");
    }
});

app.get("/admin", async (req, res) => {
    try {
        if (req.session.isAuthenticated && req.session.user === "admin") {
            const users = await getNourishusers();
            const feedbacks = await getAllFeedbacks();
            res.render('admin', { users: users, feedbacks: feedbacks });
        }
        else
        {
            res.render('permission');
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
});

app.post("/admin/:id", async (req, res) => {
    if (req.session.isAuthenticated && req.session.user == "admin") {
        const id = req.params.id;
        console.log(id);
        const result = await deleteUser(id);
        if (result.success) {
            res.send('User deleted successfully');
        } else {
            res.status(500).send('Failed to delete user');
        }
    } else {
        console.log("Not Admin");
    }
});

app.post("/admin/feedbacks/:id", async (req, res) => {
    if (req.session.isAuthenticated && req.session.user == "admin") {
        const id = req.params.id;
        console.log(id);
        const result = await deleteFeedback(id);
        if (result.success) {
            res.send('Feedback deleted successfully');
        } else {
            res.status(500).send('Failed to delete feedback');
        }
    }
    else {
        console.log("Not Admin");
    }
});

app.get('/mealplan', async (req, res) => {

    try {
        if (req.session.isAuthenticated) {
            // const apiKey = '213b4c8c3f7b460288a0c39c441982c1';
            const apiKey = '236eda03c9c04e22bd7f7ec803985287';
            const hash = '4b5v4398573406';

            const diet = req.query.diet || 'Gulten Free';
            const targetCalories = req.query.targetCalories || '2000';

            var apiUrl;

            if (req.query.diet && req.query.targetCalories && req.query.diet !== 'Gulten Free' && req.query.targetCalories !== '2000') {
                apiUrl = `https://api.spoonacular.com/mealplanner/generate?apiKey=${apiKey}&hash=${hash}&timeFrame=day&targetCalories=${targetCalories}&diet=${diet}`;
            }
            else {
                apiUrl = `https://api.spoonacular.com/mealplanner/generate?apiKey=${apiKey}&hash=${hash}&timeFrame=day&targetCalories=2000&diet=Gulten Free`;
            }

            const response = await axios.get(apiUrl);
            const mealPlan = response.data;
            res.render('mealplan', { mealPlan });
            // res.json(mealPlan);
        }
        else {
            res.render('permission');
        }
    } catch (error) {
        console.error('Error fetching data:', error);
        res.status(500).send('Error fetching data');
    }
});


app.get("/recipes/:id", async (req, res) => {
    try {
        if (req.session.isAuthenticated) {
            const apiKey = '9ca54163f3764560a75ecba555e0d379';
            const recipeId = req.params.id;
            // console.log(req.params.id);
            const response = await axios.get(`https://api.spoonacular.com/recipes/${recipeId}/information?apiKey=${apiKey}&includeNutrition=true`);
            const recipes = response.data;
            const recipeSteps = recipes.analyzedInstructions[0].steps;
            const nutrition = recipes.nutrition;
            res.render('recipes', { recipes, recipeSteps, nutrition });
            // res.json(recipeSteps);
        }else{
            res.render('permission');
        }

    } catch (error) {
        console.error('Error fetching recipe data:', error);
        res.status(500).send('Error fetching recipe data');
    }
});


app.get("/logout", (req, res) => {
    req.session.destroy();
    res.redirect("/login");
    console.log("You have logged out !!!");
});


app.listen(3000, () => {
    console.log("Server is running on port http://localhost:3000/");
});
