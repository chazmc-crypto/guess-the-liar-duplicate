import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, set, onValue, update, get } from "firebase/database";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

initializeApp(firebaseConfig);
const database = getDatabase();

const sanitize = (s="") => String(s).replace(/[.\#\$\[\]\s]/g,"_").trim();
const isValidPath = s => !/[.\#\$\[\]\s]/.test(s) && s.trim() !== "";

const promptCategories = [
  {
    name: "Prompt 1",
    real: "What's your favorite childhood memory?",
    impostors: [
      "What's your favorite childhood memory? (short answer)",
      "What's your favorite childhood memory? \u2014 give a surprising answer",
      "If asked differently: what's your favorite childhood memory?",
    ]
  },
  {
    name: "Prompt 2",
    real: "What's a hobby you secretly enjoy?",
    impostors: [
      "What's a hobby you secretly enjoy? (short answer)",
      "What's a hobby you secretly enjoy? \u2014 give a surprising answer",
      "If asked differently: what's a hobby you secretly enjoy?",
    ]
  },
  {
    name: "Prompt 3",
    real: "If you could travel anywhere tomorrow, where would you go?",
    impostors: [
      "If you could travel anywhere tomorrow, where would you go? (short answer)",
      "If you could travel anywhere tomorrow, where would you go? \u2014 give a surprising answer",
      "If asked differently: if you could travel anywhere tomorrow, where would you go?",
    ]
  },
  {
    name: "Prompt 4",
    real: "What's your go-to comfort food?",
    impostors: [
      "What's your go-to comfort food? (short answer)",
      "What's your go-to comfort food? \u2014 give a surprising answer",
      "If asked differently: what's your go-to comfort food?",
    ]
  },
  {
    name: "Prompt 5",
    real: "What's the last book you couldn't put down?",
    impostors: [
      "What's the last book you couldn't put down? (short answer)",
      "What's the last book you couldn't put down? \u2014 give a surprising answer",
      "If asked differently: what's the last book you couldn't put down?",
    ]
  },
  {
    name: "Prompt 6",
    real: "What's a skill you wish you learned earlier?",
    impostors: [
      "What's a skill you wish you learned earlier? (short answer)",
      "What's a skill you wish you learned earlier? \u2014 give a surprising answer",
      "If asked differently: what's a skill you wish you learned earlier?",
    ]
  },
  {
    name: "Prompt 7",
    real: "What's a movie you love but most people haven't seen?",
    impostors: [
      "What's a movie you love but most people haven't seen? (short answer)",
      "What's a movie you love but most people haven't seen? \u2014 give a surprising answer",
      "If asked differently: what's a movie you love but most people haven't seen?",
    ]
  },
  {
    name: "Prompt 8",
    real: "What's your favorite way to spend a rainy day?",
    impostors: [
      "What's your favorite way to spend a rainy day? (short answer)",
      "What's your favorite way to spend a rainy day? \u2014 give a surprising answer",
      "If asked differently: what's your favorite way to spend a rainy day?",
    ]
  },
  {
    name: "Prompt 9",
    real: "What's the weirdest job you've ever had?",
    impostors: [
      "What's the weirdest job you've ever had? (short answer)",
      "What's the weirdest job you've ever had? \u2014 give a surprising answer",
      "If asked differently: what's the weirdest job you've ever had?",
    ]
  },
  {
    name: "Prompt 10",
    real: "What's your favorite ice cream flavor?",
    impostors: [
      "What's your favorite ice cream flavor? (short answer)",
      "What's your favorite ice cream flavor? \u2014 give a surprising answer",
      "If asked differently: what's your favorite ice cream flavor?",
    ]
  },
  {
    name: "Prompt 11",
    real: "If you could have dinner with one fictional character, who would it be?",
    impostors: [
      "If you could have dinner with one fictional character, who would it be? (short answer)",
      "If you could have dinner with one fictional character, who would it be? \u2014 give a surprising answer",
      "If asked differently: if you could have dinner with one fictional character, who would it be?",
    ]
  },
  {
    name: "Prompt 12",
    real: "What's a song you always sing along to?",
    impostors: [
      "What's a song you always sing along to? (short answer)",
      "What's a song you always sing along to? \u2014 give a surprising answer",
      "If asked differently: what's a song you always sing along to?",
    ]
  },
  {
    name: "Prompt 13",
    real: "What's the best advice you've ever received?",
    impostors: [
      "What's the best advice you've ever received? (short answer)",
      "What's the best advice you've ever received? \u2014 give a surprising answer",
      "If asked differently: what's the best advice you've ever received?",
    ]
  },
  {
    name: "Prompt 14",
    real: "What's a pet peeve that really bugs you?",
    impostors: [
      "What's a pet peeve that really bugs you? (short answer)",
      "What's a pet peeve that really bugs you? \u2014 give a surprising answer",
      "If asked differently: what's a pet peeve that really bugs you?",
    ]
  },
  {
    name: "Prompt 15",
    real: "What's a place in your hometown you miss?",
    impostors: [
      "What's a place in your hometown you miss? (short answer)",
      "What's a place in your hometown you miss? \u2014 give a surprising answer",
      "If asked differently: what's a place in your hometown you miss?",
    ]
  },
  {
    name: "Prompt 16",
    real: "What's a food you absolutely hate?",
    impostors: [
      "What's a food you absolutely hate? (short answer)",
      "What's a food you absolutely hate? \u2014 give a surprising answer",
      "If asked differently: what's a food you absolutely hate?",
    ]
  },
  {
    name: "Prompt 17",
    real: "What's a board game you always win at?",
    impostors: [
      "What's a board game you always win at? (short answer)",
      "What's a board game you always win at? \u2014 give a surprising answer",
      "If asked differently: what's a board game you always win at?",
    ]
  },
  {
    name: "Prompt 18",
    real: "What's a small purchase that made your life better?",
    impostors: [
      "What's a small purchase that made your life better? (short answer)",
      "What's a small purchase that made your life better? \u2014 give a surprising answer",
      "If asked differently: what's a small purchase that made your life better?",
    ]
  },
  {
    name: "Prompt 19",
    real: "What's the last show you binge-watched?",
    impostors: [
      "What's the last show you binge-watched? (short answer)",
      "What's the last show you binge-watched? \u2014 give a surprising answer",
      "If asked differently: what's the last show you binge-watched?",
    ]
  },
  {
    name: "Prompt 20",
    real: "What's a tradition your family does every year?",
    impostors: [
      "What's a tradition your family does every year? (short answer)",
      "What's a tradition your family does every year? \u2014 give a surprising answer",
      "If asked differently: what's a tradition your family does every year?",
    ]
  },
  {
    name: "Prompt 21",
    real: "What's your favorite season and why?",
    impostors: [
      "What's your favorite season and why? (short answer)",
      "What's your favorite season and why? \u2014 give a surprising answer",
      "If asked differently: what's your favorite season and why?",
    ]
  },
  {
    name: "Prompt 22",
    real: "What's a superpower you'd pick for a day?",
    impostors: [
      "What's a superpower you'd pick for a day? (short answer)",
      "What's a superpower you'd pick for a day? \u2014 give a surprising answer",
      "If asked differently: what's a superpower you'd pick for a day?",
    ]
  },
  {
    name: "Prompt 23",
    real: "What's your most-used emoji?",
    impostors: [
      "What's your most-used emoji? (short answer)",
      "What's your most-used emoji? \u2014 give a surprising answer",
      "If asked differently: what's your most-used emoji?",
    ]
  },
  {
    name: "Prompt 24",
    real: "What's a habit you want to start?",
    impostors: [
      "What's a habit you want to start? (short answer)",
      "What's a habit you want to start? \u2014 give a surprising answer",
      "If asked differently: what's a habit you want to start?",
    ]
  },
  {
    name: "Prompt 25",
    real: "What's the strangest souvenir you've bought while traveling?",
    impostors: [
      "What's the strangest souvenir you've bought while traveling? (short answer)",
      "What's the strangest souvenir you've bought while traveling? \u2014 give a surprising answer",
      "If asked differently: what's the strangest souvenir you've bought while traveling?",
    ]
  },
  {
    name: "Prompt 26",
    real: "What's your favorite time of day?",
    impostors: [
      "What's your favorite time of day? (short answer)",
      "What's your favorite time of day? \u2014 give a surprising answer",
      "If asked differently: what's your favorite time of day?",
    ]
  },
  {
    name: "Prompt 27",
    real: "What's a language you'd like to learn?",
    impostors: [
      "What's a language you'd like to learn? (short answer)",
      "What's a language you'd like to learn? \u2014 give a surprising answer",
      "If asked differently: what's a language you'd like to learn?",
    ]
  },
  {
    name: "Prompt 28",
    real: "What's your favorite dessert?",
    impostors: [
      "What's your favorite dessert? (short answer)",
      "What's your favorite dessert? \u2014 give a surprising answer",
      "If asked differently: what's your favorite dessert?",
    ]
  },
  {
    name: "Prompt 29",
    real: "What's a hidden gem city you recommend?",
    impostors: [
      "What's a hidden gem city you recommend? (short answer)",
      "What's a hidden gem city you recommend? \u2014 give a surprising answer",
      "If asked differently: what's a hidden gem city you recommend?",
    ]
  },
  {
    name: "Prompt 30",
    real: "What's your favorite outdoor activity?",
    impostors: [
      "What's your favorite outdoor activity? (short answer)",
      "What's your favorite outdoor activity? \u2014 give a surprising answer",
      "If asked differently: what's your favorite outdoor activity?",
    ]
  },
  {
    name: "Prompt 31",
    real: "What's a food you could eat every day?",
    impostors: [
      "What's a food you could eat every day? (short answer)",
      "What's a food you could eat every day? \u2014 give a surprising answer",
      "If asked differently: what's a food you could eat every day?",
    ]
  },
  {
    name: "Prompt 32",
    real: "What's your favorite smell?",
    impostors: [
      "What's your favorite smell? (short answer)",
      "What's your favorite smell? \u2014 give a surprising answer",
      "If asked differently: what's your favorite smell?",
    ]
  },
  {
    name: "Prompt 33",
    real: "What's a piece of clothing you can't live without?",
    impostors: [
      "What's a piece of clothing you can't live without? (short answer)",
      "What's a piece of clothing you can't live without? \u2014 give a surprising answer",
      "If asked differently: what's a piece of clothing you can't live without?",
    ]
  },
  {
    name: "Prompt 34",
    real: "What's your favorite way to relax after work?",
    impostors: [
      "What's your favorite way to relax after work? (short answer)",
      "What's your favorite way to relax after work? \u2014 give a surprising answer",
      "If asked differently: what's your favorite way to relax after work?",
    ]
  },
  {
    name: "Prompt 35",
    real: "What's a challenge you overcame recently?",
    impostors: [
      "What's a challenge you overcame recently? (short answer)",
      "What's a challenge you overcame recently? \u2014 give a surprising answer",
      "If asked differently: what's a challenge you overcame recently?",
    ]
  },
  {
    name: "Prompt 36",
    real: "What's your favorite childhood TV show?",
    impostors: [
      "What's your favorite childhood TV show? (short answer)",
      "What's your favorite childhood TV show? \u2014 give a surprising answer",
      "If asked differently: what's your favorite childhood tv show?",
    ]
  },
  {
    name: "Prompt 37",
    real: "What's the best meal you've ever had?",
    impostors: [
      "What's the best meal you've ever had? (short answer)",
      "What's the best meal you've ever had? \u2014 give a surprising answer",
      "If asked differently: what's the best meal you've ever had?",
    ]
  },
  {
    name: "Prompt 38",
    real: "What's a hobby you'd like to try?",
    impostors: [
      "What's a hobby you'd like to try? (short answer)",
      "What's a hobby you'd like to try? \u2014 give a surprising answer",
      "If asked differently: what's a hobby you'd like to try?",
    ]
  },
  {
    name: "Prompt 39",
    real: "What's an app you use every day?",
    impostors: [
      "What's an app you use every day? (short answer)",
      "What's an app you use every day? \u2014 give a surprising answer",
      "If asked differently: what's an app you use every day?",
    ]
  },
  {
    name: "Prompt 40",
    real: "What's a guilty pleasure TV show?",
    impostors: [
      "What's a guilty pleasure TV show? (short answer)",
      "What's a guilty pleasure TV show? \u2014 give a surprising answer",
      "If asked differently: what's a guilty pleasure tv show?",
    ]
  },
  {
    name: "Prompt 41",
    real: "What's the most unusual food you've tried?",
    impostors: [
      "What's the most unusual food you've tried? (short answer)",
      "What's the most unusual food you've tried? \u2014 give a surprising answer",
      "If asked differently: what's the most unusual food you've tried?",
    ]
  },
  {
    name: "Prompt 42",
    real: "What's your favorite coffee order?",
    impostors: [
      "What's your favorite coffee order? (short answer)",
      "What's your favorite coffee order? \u2014 give a surprising answer",
      "If asked differently: what's your favorite coffee order?",
    ]
  },
  {
    name: "Prompt 43",
    real: "What's a goal you're working on right now?",
    impostors: [
      "What's a goal you're working on right now? (short answer)",
      "What's a goal you're working on right now? \u2014 give a surprising answer",
      "If asked differently: what's a goal you're working on right now?",
    ]
  },
  {
    name: "Prompt 44",
    real: "What's your favorite holiday?",
    impostors: [
      "What's your favorite holiday? (short answer)",
      "What's your favorite holiday? \u2014 give a surprising answer",
      "If asked differently: what's your favorite holiday?",
    ]
  },
  {
    name: "Prompt 45",
    real: "What's the last photo you took?",
    impostors: [
      "What's the last photo you took? (short answer)",
      "What's the last photo you took? \u2014 give a surprising answer",
      "If asked differently: what's the last photo you took?",
    ]
  },
  {
    name: "Prompt 46",
    real: "What's your favorite icebreaker question?",
    impostors: [
      "What's your favorite icebreaker question? (short answer)",
      "What's your favorite icebreaker question? \u2014 give a surprising answer",
      "If asked differently: what's your favorite icebreaker question?",
    ]
  },
  {
    name: "Prompt 47",
    real: "What's a song that reminds you of summer?",
    impostors: [
      "What's a song that reminds you of summer? (short answer)",
      "What's a song that reminds you of summer? \u2014 give a surprising answer",
      "If asked differently: what's a song that reminds you of summer?",
    ]
  },
  {
    name: "Prompt 48",
    real: "What's your dream job as a kid?",
    impostors: [
      "What's your dream job as a kid? (short answer)",
      "What's your dream job as a kid? \u2014 give a surprising answer",
      "If asked differently: what's your dream job as a kid?",
    ]
  },
  {
    name: "Prompt 49",
    real: "What's a city you'd love to live in for a year?",
    impostors: [
      "What's a city you'd love to live in for a year? (short answer)",
      "What's a city you'd love to live in for a year? \u2014 give a surprising answer",
      "If asked differently: what's a city you'd love to live in for a year?",
    ]
  },
  {
    name: "Prompt 50",
    real: "What's your favorite snack?",
    impostors: [
      "What's your favorite snack? (short answer)",
      "What's your favorite snack? \u2014 give a surprising answer",
      "If asked differently: what's your favorite snack?",
    ]
  },
  {
    name: "Prompt 51",
    real: "What's a habit you are proud of?",
    impostors: [
      "What's a habit you are proud of? (short answer)",
      "What's a habit you are proud of? \u2014 give a surprising answer",
      "If asked differently: what's a habit you are proud of?",
    ]
  },
  {
    name: "Prompt 52",
    real: "What's the best gift you've ever received?",
    impostors: [
      "What's the best gift you've ever received? (short answer)",
      "What's the best gift you've ever received? \u2014 give a surprising answer",
      "If asked differently: what's the best gift you've ever received?",
    ]
  },
  {
    name: "Prompt 53",
    real: "What's your favorite quote?",
    impostors: [
      "What's your favorite quote? (short answer)",
      "What's your favorite quote? \u2014 give a surprising answer",
      "If asked differently: what's your favorite quote?",
    ]
  },
  {
    name: "Prompt 54",
    real: "What's your favorite thing about your current city?",
    impostors: [
      "What's your favorite thing about your current city? (short answer)",
      "What's your favorite thing about your current city? \u2014 give a surprising answer",
      "If asked differently: what's your favorite thing about your current city?",
    ]
  },
  {
    name: "Prompt 55",
    real: "What's a sport you'd like to learn?",
    impostors: [
      "What's a sport you'd like to learn? (short answer)",
      "What's a sport you'd like to learn? \u2014 give a surprising answer",
      "If asked differently: what's a sport you'd like to learn?",
    ]
  },
  {
    name: "Prompt 56",
    real: "What's the first concert you attended?",
    impostors: [
      "What's the first concert you attended? (short answer)",
      "What's the first concert you attended? \u2014 give a surprising answer",
      "If asked differently: what's the first concert you attended?",
    ]
  },
  {
    name: "Prompt 57",
    real: "What's a guilty pleasure food?",
    impostors: [
      "What's a guilty pleasure food? (short answer)",
      "What's a guilty pleasure food? \u2014 give a surprising answer",
      "If asked differently: what's a guilty pleasure food?",
    ]
  },
  {
    name: "Prompt 58",
    real: "What's your favorite app feature?",
    impostors: [
      "What's your favorite app feature? (short answer)",
      "What's your favorite app feature? \u2014 give a surprising answer",
      "If asked differently: what's your favorite app feature?",
    ]
  },
  {
    name: "Prompt 59",
    real: "What's a movie that made you cry?",
    impostors: [
      "What's a movie that made you cry? (short answer)",
      "What's a movie that made you cry? \u2014 give a surprising answer",
      "If asked differently: what's a movie that made you cry?",
    ]
  },
  {
    name: "Prompt 60",
    real: "What's something you always carry with you?",
    impostors: [
      "What's something you always carry with you? (short answer)",
      "What's something you always carry with you? \u2014 give a surprising answer",
      "If asked differently: what's something you always carry with you?",
    ]
  },
  {
    name: "Prompt 61",
    real: "What's a fashion trend you secretly like?",
    impostors: [
      "What's a fashion trend you secretly like? (short answer)",
      "What's a fashion trend you secretly like? \u2014 give a surprising answer",
      "If asked differently: what's a fashion trend you secretly like?",
    ]
  },
  {
    name: "Prompt 62",
    real: "What's your favorite childhood book?",
    impostors: [
      "What's your favorite childhood book? (short answer)",
      "What's your favorite childhood book? \u2014 give a surprising answer",
      "If asked differently: what's your favorite childhood book?",
    ]
  },
  {
    name: "Prompt 63",
    real: "What's a random skill you can teach someone?",
    impostors: [
      "What's a random skill you can teach someone? (short answer)",
      "What's a random skill you can teach someone? \u2014 give a surprising answer",
      "If asked differently: what's a random skill you can teach someone?",
    ]
  },
  {
    name: "Prompt 64",
    real: "What's a food that brings back memories?",
    impostors: [
      "What's a food that brings back memories? (short answer)",
      "What's a food that brings back memories? \u2014 give a surprising answer",
      "If asked differently: what's a food that brings back memories?",
    ]
  },
  {
    name: "Prompt 65",
    real: "What's the best piece of advice you would give your younger self?",
    impostors: [
      "What's the best piece of advice you would give your younger self? (short answer)",
      "What's the best piece of advice you would give your younger self? \u2014 give a surprising answer",
      "If asked differently: what's the best piece of advice you would give your younger self?",
    ]
  },
  {
    name: "Prompt 66",
    real: "What's a dream you still want to accomplish?",
    impostors: [
      "What's a dream you still want to accomplish? (short answer)",
      "What's a dream you still want to accomplish? \u2014 give a surprising answer",
      "If asked differently: what's a dream you still want to accomplish?",
    ]
  },
  {
    name: "Prompt 67",
    real: "What's a scent that takes you back to a place?",
    impostors: [
      "What's a scent that takes you back to a place? (short answer)",
      "What's a scent that takes you back to a place? \u2014 give a surprising answer",
      "If asked differently: what's a scent that takes you back to a place?",
    ]
  },
  {
    name: "Prompt 68",
    real: "What's your favorite pizza topping?",
    impostors: [
      "What's your favorite pizza topping? (short answer)",
      "What's your favorite pizza topping? \u2014 give a surprising answer",
      "If asked differently: what's your favorite pizza topping?",
    ]
  },
  {
    name: "Prompt 69",
    real: "What's a moment that made you proud recently?",
    impostors: [
      "What's a moment that made you proud recently? (short answer)",
      "What's a moment that made you proud recently? \u2014 give a surprising answer",
      "If asked differently: what's a moment that made you proud recently?",
    ]
  },
  {
    name: "Prompt 70",
    real: "What's a podcast you recommend?",
    impostors: [
      "What's a podcast you recommend? (short answer)",
      "What's a podcast you recommend? \u2014 give a surprising answer",
      "If asked differently: what's a podcast you recommend?",
    ]
  },
  {
    name: "Prompt 71",
    real: "What's something that makes your day better instantly?",
    impostors: [
      "What's something that makes your day better instantly? (short answer)",
      "What's something that makes your day better instantly? \u2014 give a surprising answer",
      "If asked differently: what's something that makes your day better instantly?",
    ]
  },
  {
    name: "Prompt 72",
    real: "What's your favorite public holiday dish?",
    impostors: [
      "What's your favorite public holiday dish? (short answer)",
      "What's your favorite public holiday dish? \u2014 give a surprising answer",
      "If asked differently: what's your favorite public holiday dish?",
    ]
  },
  {
    name: "Prompt 73",
    real: "What's a place you'd go for a digital detox?",
    impostors: [
      "What's a place you'd go for a digital detox? (short answer)",
      "What's a place you'd go for a digital detox? \u2014 give a surprising answer",
      "If asked differently: what's a place you'd go for a digital detox?",
    ]
  },
  {
    name: "Prompt 74",
    real: "What's the best thing about being your age?",
    impostors: [
      "What's the best thing about being your age? (short answer)",
      "What's the best thing about being your age? \u2014 give a surprising answer",
      "If asked differently: what's the best thing about being your age?",
    ]
  },
  {
    name: "Prompt 75",
    real: "What's a superstition you (or your family) follow?",
    impostors: [
      "What's a superstition you (or your family) follow? (short answer)",
      "What's a superstition you (or your family) follow? \u2014 give a surprising answer",
      "If asked differently: what's a superstition you (or your family) follow?",
    ]
  },
  {
    name: "Prompt 76",
    real: "What's a tradition you'd like to start?",
    impostors: [
      "What's a tradition you'd like to start? (short answer)",
      "What's a tradition you'd like to start? \u2014 give a surprising answer",
      "If asked differently: what's a tradition you'd like to start?",
    ]
  },
  {
    name: "Prompt 77",
    real: "What's a weird fact you know?",
    impostors: [
      "What's a weird fact you know? (short answer)",
      "What's a weird fact you know? \u2014 give a surprising answer",
      "If asked differently: what's a weird fact you know?",
    ]
  },
  {
    name: "Prompt 78",
    real: "What's a hobby you wish you had more time for?",
    impostors: [
      "What's a hobby you wish you had more time for? (short answer)",
      "What's a hobby you wish you had more time for? \u2014 give a surprising answer",
      "If asked differently: what's a hobby you wish you had more time for?",
    ]
  },
  {
    name: "Prompt 79",
    real: "What's the most adventurous thing you've done?",
    impostors: [
      "What's the most adventurous thing you've done? (short answer)",
      "What's the most adventurous thing you've done? \u2014 give a surprising answer",
      "If asked differently: what's the most adventurous thing you've done?",
    ]
  },
  {
    name: "Prompt 80",
    real: "What's a skill that makes you feel accomplished?",
    impostors: [
      "What's a skill that makes you feel accomplished? (short answer)",
      "What's a skill that makes you feel accomplished? \u2014 give a surprising answer",
      "If asked differently: what's a skill that makes you feel accomplished?",
    ]
  },
  {
    name: "Prompt 81",
    real: "What's a comfort movie you rewatch often?",
    impostors: [
      "What's a comfort movie you rewatch often? (short answer)",
      "What's a comfort movie you rewatch often? \u2014 give a surprising answer",
      "If asked differently: what's a comfort movie you rewatch often?",
    ]
  },
  {
    name: "Prompt 82",
    real: "What's a topic you could talk about for hours?",
    impostors: [
      "What's a topic you could talk about for hours? (short answer)",
      "What's a topic you could talk about for hours? \u2014 give a surprising answer",
      "If asked differently: what's a topic you could talk about for hours?",
    ]
  },
  {
    name: "Prompt 83",
    real: "What's your favorite way to celebrate small wins?",
    impostors: [
      "What's your favorite way to celebrate small wins? (short answer)",
      "What's your favorite way to celebrate small wins? \u2014 give a surprising answer",
      "If asked differently: what's your favorite way to celebrate small wins?",
    ]
  },
  {
    name: "Prompt 84",
    real: "What's your favorite local restaurant?",
    impostors: [
      "What's your favorite local restaurant? (short answer)",
      "What's your favorite local restaurant? \u2014 give a surprising answer",
      "If asked differently: what's your favorite local restaurant?",
    ]
  },
  {
    name: "Prompt 85",
    real: "What's something you learned recently that surprised you?",
    impostors: [
      "What's something you learned recently that surprised you? (short answer)",
      "What's something you learned recently that surprised you? \u2014 give a surprising answer",
      "If asked differently: what's something you learned recently that surprised you?",
    ]
  },
  {
    name: "Prompt 86",
    real: "What's your favorite childhood game?",
    impostors: [
      "What's your favorite childhood game? (short answer)",
      "What's your favorite childhood game? \u2014 give a surprising answer",
      "If asked differently: what's your favorite childhood game?",
    ]
  },
  {
    name: "Prompt 87",
    real: "What's a difficult decision you made that paid off?",
    impostors: [
      "What's a difficult decision you made that paid off? (short answer)",
      "What's a difficult decision you made that paid off? \u2014 give a surprising answer",
      "If asked differently: what's a difficult decision you made that paid off?",
    ]
  },
  {
    name: "Prompt 88",
    real: "What's a decorative item in your home you love?",
    impostors: [
      "What's a decorative item in your home you love? (short answer)",
      "What's a decorative item in your home you love? \u2014 give a surprising answer",
      "If asked differently: what's a decorative item in your home you love?",
    ]
  },
  {
    name: "Prompt 89",
    real: "What's something you wish schools taught?",
    impostors: [
      "What's something you wish schools taught? (short answer)",
      "What's something you wish schools taught? \u2014 give a surprising answer",
      "If asked differently: what's something you wish schools taught?",
    ]
  },
  {
    name: "Prompt 90",
    real: "What's a technology you can't live without?",
    impostors: [
      "What's a technology you can't live without? (short answer)",
      "What's a technology you can't live without? \u2014 give a surprising answer",
      "If asked differently: what's a technology you can't live without?",
    ]
  },
  {
    name: "Prompt 91",
    real: "What's an unusual tradition in your family?",
    impostors: [
      "What's an unusual tradition in your family? (short answer)",
      "What's an unusual tradition in your family? \u2014 give a surprising answer",
      "If asked differently: what's an unusual tradition in your family?",
    ]
  },
  {
    name: "Prompt 92",
    real: "What's a memorable compliment you received?",
    impostors: [
      "What's a memorable compliment you received? (short answer)",
      "What's a memorable compliment you received? \u2014 give a surprising answer",
      "If asked differently: what's a memorable compliment you received?",
    ]
  },
  {
    name: "Prompt 93",
    real: "What's one thing you refuse to share?",
    impostors: [
      "What's one thing you refuse to share? (short answer)",
      "What's one thing you refuse to share? \u2014 give a surprising answer",
      "If asked differently: what's one thing you refuse to share?",
    ]
  },
  {
    name: "Prompt 94",
    real: "What's a way you like to be thanked?",
    impostors: [
      "What's a way you like to be thanked? (short answer)",
      "What's a way you like to be thanked? \u2014 give a surprising answer",
      "If asked differently: what's a way you like to be thanked?",
    ]
  },
  {
    name: "Prompt 95",
    real: "What's a cultural event you enjoy attending?",
    impostors: [
      "What's a cultural event you enjoy attending? (short answer)",
      "What's a cultural event you enjoy attending? \u2014 give a surprising answer",
      "If asked differently: what's a cultural event you enjoy attending?",
    ]
  },
  {
    name: "Prompt 96",
    real: "What's your favorite road trip snack?",
    impostors: [
      "What's your favorite road trip snack? (short answer)",
      "What's your favorite road trip snack? \u2014 give a surprising answer",
      "If asked differently: what's your favorite road trip snack?",
    ]
  },
  {
    name: "Prompt 97",
    real: "What's a project you completed recently?",
    impostors: [
      "What's a project you completed recently? (short answer)",
      "What's a project you completed recently? \u2014 give a surprising answer",
      "If asked differently: what's a project you completed recently?",
    ]
  },
  {
    name: "Prompt 98",
    real: "What's a dish you cook that impresses people?",
    impostors: [
      "What's a dish you cook that impresses people? (short answer)",
      "What's a dish you cook that impresses people? \u2014 give a surprising answer",
      "If asked differently: what's a dish you cook that impresses people?",
    ]
  },
  {
    name: "Prompt 99",
    real: "What's your favorite museum or gallery?",
    impostors: [
      "What's your favorite museum or gallery? (short answer)",
      "What's your favorite museum or gallery? \u2014 give a surprising answer",
      "If asked differently: what's your favorite museum or gallery?",
    ]
  },
  {
    name: "Prompt 100",
    real: "What's a way you unwind on weekends?",
    impostors: [
      "What's a way you unwind on weekends? (short answer)",
      "What's a way you unwind on weekends? \u2014 give a surprising answer",
      "If asked differently: what's a way you unwind on weekends?",
    ]
  },
  {
    name: "Prompt 101",
    real: "What's a memory that always makes you smile?",
    impostors: [
      "What's a memory that always makes you smile? (short answer)",
      "What's a memory that always makes you smile? \u2014 give a surprising answer",
      "If asked differently: what's a memory that always makes you smile?",
    ]
  },
  {
    name: "Prompt 102",
    real: "What's a phrase you overuse?",
    impostors: [
      "What's a phrase you overuse? (short answer)",
      "What's a phrase you overuse? \u2014 give a surprising answer",
      "If asked differently: what's a phrase you overuse?",
    ]
  },
  {
    name: "Prompt 103",
    real: "What's a product you recommend to friends?",
    impostors: [
      "What's a product you recommend to friends? (short answer)",
      "What's a product you recommend to friends? \u2014 give a surprising answer",
      "If asked differently: what's a product you recommend to friends?",
    ]
  },
  {
    name: "Prompt 104",
    real: "What's a tech gadget you'd love to own?",
    impostors: [
      "What's a tech gadget you'd love to own? (short answer)",
      "What's a tech gadget you'd love to own? \u2014 give a surprising answer",
      "If asked differently: what's a tech gadget you'd love to own?",
    ]
  },
  {
    name: "Prompt 105",
    real: "What's the most thoughtful gift you gave someone?",
    impostors: [
      "What's the most thoughtful gift you gave someone? (short answer)",
      "What's the most thoughtful gift you gave someone? \u2014 give a surprising answer",
      "If asked differently: what's the most thoughtful gift you gave someone?",
    ]
  },
  {
    name: "Prompt 106",
    real: "What's a small change that improved your routine?",
    impostors: [
      "What's a small change that improved your routine? (short answer)",
      "What's a small change that improved your routine? \u2014 give a surprising answer",
      "If asked differently: what's a small change that improved your routine?",
    ]
  },
  {
    name: "Prompt 107",
    real: "What's your favorite fast-food order?",
    impostors: [
      "What's your favorite fast-food order? (short answer)",
      "What's your favorite fast-food order? \u2014 give a surprising answer",
      "If asked differently: what's your favorite fast-food order?",
    ]
  },
  {
    name: "Prompt 108",
    real: "What's a lesson you learned from failure?",
    impostors: [
      "What's a lesson you learned from failure? (short answer)",
      "What's a lesson you learned from failure? \u2014 give a surprising answer",
      "If asked differently: what's a lesson you learned from failure?",
    ]
  },
  {
    name: "Prompt 109",
    real: "What's a song you know all the lyrics to?",
    impostors: [
      "What's a song you know all the lyrics to? (short answer)",
      "What's a song you know all the lyrics to? \u2014 give a surprising answer",
      "If asked differently: what's a song you know all the lyrics to?",
    ]
  },
  {
    name: "Prompt 110",
    real: "What's your favorite way to get exercise?",
    impostors: [
      "What's your favorite way to get exercise? (short answer)",
      "What's your favorite way to get exercise? \u2014 give a surprising answer",
      "If asked differently: what's your favorite way to get exercise?",
    ]
  },
  {
    name: "Prompt 111",
    real: "What's the best surprise you've ever received?",
    impostors: [
      "What's the best surprise you've ever received? (short answer)",
      "What's the best surprise you've ever received? \u2014 give a surprising answer",
      "If asked differently: what's the best surprise you've ever received?",
    ]
  },
  {
    name: "Prompt 112",
    real: "What's a festival or market you love?",
    impostors: [
      "What's a festival or market you love? (short answer)",
      "What's a festival or market you love? \u2014 give a surprising answer",
      "If asked differently: what's a festival or market you love?",
    ]
  },
  {
    name: "Prompt 113",
    real: "What's a local spot you'd take a visitor to?",
    impostors: [
      "What's a local spot you'd take a visitor to? (short answer)",
      "What's a local spot you'd take a visitor to? \u2014 give a surprising answer",
      "If asked differently: what's a local spot you'd take a visitor to?",
    ]
  },
  {
    name: "Prompt 114",
    real: "What's a food you tried and ended up loving?",
    impostors: [
      "What's a food you tried and ended up loving? (short answer)",
      "What's a food you tried and ended up loving? \u2014 give a surprising answer",
      "If asked differently: what's a food you tried and ended up loving?",
    ]
  },
  {
    name: "Prompt 115",
    real: "What's a thing you collect or used to collect?",
    impostors: [
      "What's a thing you collect or used to collect? (short answer)",
      "What's a thing you collect or used to collect? \u2014 give a surprising answer",
      "If asked differently: what's a thing you collect or used to collect?",
    ]
  },
  {
    name: "Prompt 116",
    real: "What's your favorite way to start the morning?",
    impostors: [
      "What's your favorite way to start the morning? (short answer)",
      "What's your favorite way to start the morning? \u2014 give a surprising answer",
      "If asked differently: what's your favorite way to start the morning?",
    ]
  },
  {
    name: "Prompt 117",
    real: "What's a sound that relaxes you?",
    impostors: [
      "What's a sound that relaxes you? (short answer)",
      "What's a sound that relaxes you? \u2014 give a surprising answer",
      "If asked differently: what's a sound that relaxes you?",
    ]
  },
  {
    name: "Prompt 118",
    real: "What's a classroom subject you enjoyed most?",
    impostors: [
      "What's a classroom subject you enjoyed most? (short answer)",
      "What's a classroom subject you enjoyed most? \u2014 give a surprising answer",
      "If asked differently: what's a classroom subject you enjoyed most?",
    ]
  },
  {
    name: "Prompt 119",
    real: "What's the longest book you've read?",
    impostors: [
      "What's the longest book you've read? (short answer)",
      "What's the longest book you've read? \u2014 give a surprising answer",
      "If asked differently: what's the longest book you've read?",
    ]
  },
  {
    name: "Prompt 120",
    real: "What's your favorite thing to bake or cook?",
    impostors: [
      "What's your favorite thing to bake or cook? (short answer)",
      "What's your favorite thing to bake or cook? \u2014 give a surprising answer",
      "If asked differently: what's your favorite thing to bake or cook?",
    ]
  },
  {
    name: "Prompt 121",
    real: "What's the best advice you've given someone else?",
    impostors: [
      "What's the best advice you've given someone else? (short answer)",
      "What's the best advice you've given someone else? \u2014 give a surprising answer",
      "If asked differently: what's the best advice you've given someone else?",
    ]
  },
  {
    name: "Prompt 122",
    real: "What's a place you keep returning to?",
    impostors: [
      "What's a place you keep returning to? (short answer)",
      "What's a place you keep returning to? \u2014 give a surprising answer",
      "If asked differently: what's a place you keep returning to?",
    ]
  },
  {
    name: "Prompt 123",
    real: "What's a challenge you want to tackle next year?",
    impostors: [
      "What's a challenge you want to tackle next year? (short answer)",
      "What's a challenge you want to tackle next year? \u2014 give a surprising answer",
      "If asked differently: what's a challenge you want to tackle next year?",
    ]
  },
  {
    name: "Prompt 124",
    real: "What's a cool tradition from another culture you like?",
    impostors: [
      "What's a cool tradition from another culture you like? (short answer)",
      "What's a cool tradition from another culture you like? \u2014 give a surprising answer",
      "If asked differently: what's a cool tradition from another culture you like?",
    ]
  },
  {
    name: "Prompt 125",
    real: "What's the earliest memory you have?",
    impostors: [
      "What's the earliest memory you have? (short answer)",
      "What's the earliest memory you have? \u2014 give a surprising answer",
      "If asked differently: what's the earliest memory you have?",
    ]
  },
  {
    name: "Prompt 126",
    real: "What's a guilty pleasure snack you hide?",
    impostors: [
      "What's a guilty pleasure snack you hide? (short answer)",
      "What's a guilty pleasure snack you hide? \u2014 give a surprising answer",
      "If asked differently: what's a guilty pleasure snack you hide?",
    ]
  },
  {
    name: "Prompt 127",
    real: "What's your favorite thing about meeting new people?",
    impostors: [
      "What's your favorite thing about meeting new people? (short answer)",
      "What's your favorite thing about meeting new people? \u2014 give a surprising answer",
      "If asked differently: what's your favorite thing about meeting new people?",
    ]
  },
  {
    name: "Prompt 128",
    real: "What's a habit you dropped that improved your life?",
    impostors: [
      "What's a habit you dropped that improved your life? (short answer)",
      "What's a habit you dropped that improved your life? \u2014 give a surprising answer",
      "If asked differently: what's a habit you dropped that improved your life?",
    ]
  },
  {
    name: "Prompt 129",
    real: "What's a holiday you always look forward to?",
    impostors: [
      "What's a holiday you always look forward to? (short answer)",
      "What's a holiday you always look forward to? \u2014 give a surprising answer",
      "If asked differently: what's a holiday you always look forward to?",
    ]
  },
  {
    name: "Prompt 130",
    real: "What's something you grew out of that you miss?",
    impostors: [
      "What's something you grew out of that you miss? (short answer)",
      "What's something you grew out of that you miss? \u2014 give a surprising answer",
      "If asked differently: what's something you grew out of that you miss?",
    ]
  },
  {
    name: "Prompt 131",
    real: "What's a compliment that always makes you smile?",
    impostors: [
      "What's a compliment that always makes you smile? (short answer)",
      "What's a compliment that always makes you smile? \u2014 give a surprising answer",
      "If asked differently: what's a compliment that always makes you smile?",
    ]
  },
  {
    name: "Prompt 132",
    real: "What's the quirkiest thing in your room?",
    impostors: [
      "What's the quirkiest thing in your room? (short answer)",
      "What's the quirkiest thing in your room? \u2014 give a surprising answer",
      "If asked differently: what's the quirkiest thing in your room?",
    ]
  },
  {
    name: "Prompt 133",
    real: "What's your favorite way to learn new things?",
    impostors: [
      "What's your favorite way to learn new things? (short answer)",
      "What's your favorite way to learn new things? \u2014 give a surprising answer",
      "If asked differently: what's your favorite way to learn new things?",
    ]
  },
  {
    name: "Prompt 134",
    real: "What's a way you show support to friends?",
    impostors: [
      "What's a way you show support to friends? (short answer)",
      "What's a way you show support to friends? \u2014 give a surprising answer",
      "If asked differently: what's a way you show support to friends?",
    ]
  },
  {
    name: "Prompt 135",
    real: "What's a time you felt completely at ease?",
    impostors: [
      "What's a time you felt completely at ease? (short answer)",
      "What's a time you felt completely at ease? \u2014 give a surprising answer",
      "If asked differently: what's a time you felt completely at ease?",
    ]
  },
  {
    name: "Prompt 136",
    real: "What's your favorite app for productivity?",
    impostors: [
      "What's your favorite app for productivity? (short answer)",
      "What's your favorite app for productivity? \u2014 give a surprising answer",
      "If asked differently: what's your favorite app for productivity?",
    ]
  },
  {
    name: "Prompt 137",
    real: "What's a historical era you'd like to visit?",
    impostors: [
      "What's a historical era you'd like to visit? (short answer)",
      "What's a historical era you'd like to visit? \u2014 give a surprising answer",
      "If asked differently: what's a historical era you'd like to visit?",
    ]
  },
  {
    name: "Prompt 138",
    real: "What's a food pairing you unexpectedly love?",
    impostors: [
      "What's a food pairing you unexpectedly love? (short answer)",
      "What's a food pairing you unexpectedly love? \u2014 give a surprising answer",
      "If asked differently: what's a food pairing you unexpectedly love?",
    ]
  },
  {
    name: "Prompt 139",
    real: "What's your favorite way to spend a Sunday afternoon?",
    impostors: [
      "What's your favorite way to spend a Sunday afternoon? (short answer)",
      "What's your favorite way to spend a Sunday afternoon? \u2014 give a surprising answer",
      "If asked differently: what's your favorite way to spend a sunday afternoon?",
    ]
  },
  {
    name: "Prompt 140",
    real: "What's an item on your bucket list?",
    impostors: [
      "What's an item on your bucket list? (short answer)",
      "What's an item on your bucket list? \u2014 give a surprising answer",
      "If asked differently: what's an item on your bucket list?",
    ]
  },
  {
    name: "Prompt 141",
    real: "What's the most beautiful place you've seen?",
    impostors: [
      "What's the most beautiful place you've seen? (short answer)",
      "What's the most beautiful place you've seen? \u2014 give a surprising answer",
      "If asked differently: what's the most beautiful place you've seen?",
    ]
  },
  {
    name: "Prompt 142",
    real: "What's a challenge you've solved creatively?",
    impostors: [
      "What's a challenge you've solved creatively? (short answer)",
      "What's a challenge you've solved creatively? \u2014 give a surprising answer",
      "If asked differently: what's a challenge you've solved creatively?",
    ]
  },
  {
    name: "Prompt 143",
    real: "What's a habit that helps your focus?",
    impostors: [
      "What's a habit that helps your focus? (short answer)",
      "What's a habit that helps your focus? \u2014 give a surprising answer",
      "If asked differently: what's a habit that helps your focus?",
    ]
  },
  {
    name: "Prompt 144",
    real: "What's the last thing you fixed yourself?",
    impostors: [
      "What's the last thing you fixed yourself? (short answer)",
      "What's the last thing you fixed yourself? \u2014 give a surprising answer",
      "If asked differently: what's the last thing you fixed yourself?",
    ]
  },
  {
    name: "Prompt 145",
    real: "What's your favorite beverage (non-alcoholic)?",
    impostors: [
      "What's your favorite beverage (non-alcoholic)? (short answer)",
      "What's your favorite beverage (non-alcoholic)? \u2014 give a surprising answer",
      "If asked differently: what's your favorite beverage (non-alcoholic)?",
    ]
  },
  {
    name: "Prompt 146",
    real: "What's a funny misunderstanding you've had?",
    impostors: [
      "What's a funny misunderstanding you've had? (short answer)",
      "What's a funny misunderstanding you've had? \u2014 give a surprising answer",
      "If asked differently: what's a funny misunderstanding you've had?",
    ]
  },
  {
    name: "Prompt 147",
    real: "What's something you learned from a grandparent?",
    impostors: [
      "What's something you learned from a grandparent? (short answer)",
      "What's something you learned from a grandparent? \u2014 give a surprising answer",
      "If asked differently: what's something you learned from a grandparent?",
    ]
  },
  {
    name: "Prompt 148",
    real: "What's a niche hobby you enjoy?",
    impostors: [
      "What's a niche hobby you enjoy? (short answer)",
      "What's a niche hobby you enjoy? \u2014 give a surprising answer",
      "If asked differently: what's a niche hobby you enjoy?",
    ]
  },
  {
    name: "Prompt 149",
    real: "What's your favorite comfort outfit?",
    impostors: [
      "What's your favorite comfort outfit? (short answer)",
      "What's your favorite comfort outfit? \u2014 give a surprising answer",
      "If asked differently: what's your favorite comfort outfit?",
    ]
  },
  {
    name: "Prompt 150",
    real: "What's an underrated skill people should learn?",
    impostors: [
      "What's an underrated skill people should learn? (short answer)",
      "What's an underrated skill people should learn? \u2014 give a surprising answer",
      "If asked differently: what's an underrated skill people should learn?",
    ]
  },
  {
    name: "Prompt 151",
    real: "What's the best public transport experience you've had?",
    impostors: [
      "What's the best public transport experience you've had? (short answer)",
      "What's the best public transport experience you've had? \u2014 give a surprising answer",
      "If asked differently: what's the best public transport experience you've had?",
    ]
  },
  {
    name: "Prompt 152",
    real: "What's your favorite local dessert?",
    impostors: [
      "What's your favorite local dessert? (short answer)",
      "What's your favorite local dessert? \u2014 give a surprising answer",
      "If asked differently: what's your favorite local dessert?",
    ]
  },
  {
    name: "Prompt 153",
    real: "What's a place that surprised you in a good way?",
    impostors: [
      "What's a place that surprised you in a good way? (short answer)",
      "What's a place that surprised you in a good way? \u2014 give a surprising answer",
      "If asked differently: what's a place that surprised you in a good way?",
    ]
  },
  {
    name: "Prompt 154",
    real: "What's a rule you always follow while traveling?",
    impostors: [
      "What's a rule you always follow while traveling? (short answer)",
      "What's a rule you always follow while traveling? \u2014 give a surprising answer",
      "If asked differently: what's a rule you always follow while traveling?",
    ]
  },
  {
    name: "Prompt 155",
    real: "What's your favorite childhood snack?",
    impostors: [
      "What's your favorite childhood snack? (short answer)",
      "What's your favorite childhood snack? \u2014 give a surprising answer",
      "If asked differently: what's your favorite childhood snack?",
    ]
  },
  {
    name: "Prompt 156",
    real: "What's a piece of advice you wish you'd followed sooner?",
    impostors: [
      "What's a piece of advice you wish you'd followed sooner? (short answer)",
      "What's a piece of advice you wish you'd followed sooner? \u2014 give a surprising answer",
      "If asked differently: what's a piece of advice you wish you'd followed sooner?",
    ]
  },
  {
    name: "Prompt 157",
    real: "What's one word that describes your sense of humor?",
    impostors: [
      "What's one word that describes your sense of humor? (short answer)",
      "What's one word that describes your sense of humor? \u2014 give a surprising answer",
      "If asked differently: what's one word that describes your sense of humor?",
    ]
  },
  {
    name: "Prompt 158",
    real: "What's a memory that taught you empathy?",
    impostors: [
      "What's a memory that taught you empathy? (short answer)",
      "What's a memory that taught you empathy? \u2014 give a surprising answer",
      "If asked differently: what's a memory that taught you empathy?",
    ]
  },
  {
    name: "Prompt 159",
    real: "What's your favorite thing to do outdoors?",
    impostors: [
      "What's your favorite thing to do outdoors? (short answer)",
      "What's your favorite thing to do outdoors? \u2014 give a surprising answer",
      "If asked differently: what's your favorite thing to do outdoors?",
    ]
  },
  {
    name: "Prompt 160",
    real: "What's a creative outlet you rely on?",
    impostors: [
      "What's a creative outlet you rely on? (short answer)",
      "What's a creative outlet you rely on? \u2014 give a surprising answer",
      "If asked differently: what's a creative outlet you rely on?",
    ]
  },
  {
    name: "Prompt 161",
    real: "What's the best compliment you've ever given someone?",
    impostors: [
      "What's the best compliment you've ever given someone? (short answer)",
      "What's the best compliment you've ever given someone? \u2014 give a surprising answer",
      "If asked differently: what's the best compliment you've ever given someone?",
    ]
  },
  {
    name: "Prompt 162",
    real: "What's a small ritual you do before bedtime?",
    impostors: [
      "What's a small ritual you do before bedtime? (short answer)",
      "What's a small ritual you do before bedtime? \u2014 give a surprising answer",
      "If asked differently: what's a small ritual you do before bedtime?",
    ]
  },
  {
    name: "Prompt 163",
    real: "What's your favorite part of the day at work?",
    impostors: [
      "What's your favorite part of the day at work? (short answer)",
      "What's your favorite part of the day at work? \u2014 give a surprising answer",
      "If asked differently: what's your favorite part of the day at work?",
    ]
  },
  {
    name: "Prompt 164",
    real: "What's something you wish you did more often?",
    impostors: [
      "What's something you wish you did more often? (short answer)",
      "What's something you wish you did more often? \u2014 give a surprising answer",
      "If asked differently: what's something you wish you did more often?",
    ]
  },
  {
    name: "Prompt 165",
    real: "Extra prompt #165",
    impostors: [
      "Extra prompt #165 (short answer)",
      "Extra prompt #165 \u2014 give a surprising answer",
      "If asked differently: extra prompt #165",
    ]
  },
  {
    name: "Prompt 166",
    real: "Extra prompt #166",
    impostors: [
      "Extra prompt #166 (short answer)",
      "Extra prompt #166 \u2014 give a surprising answer",
      "If asked differently: extra prompt #166",
    ]
  },
  {
    name: "Prompt 167",
    real: "Extra prompt #167",
    impostors: [
      "Extra prompt #167 (short answer)",
      "Extra prompt #167 \u2014 give a surprising answer",
      "If asked differently: extra prompt #167",
    ]
  },
  {
    name: "Prompt 168",
    real: "Extra prompt #168",
    impostors: [
      "Extra prompt #168 (short answer)",
      "Extra prompt #168 \u2014 give a surprising answer",
      "If asked differently: extra prompt #168",
    ]
  },
  {
    name: "Prompt 169",
    real: "Extra prompt #169",
    impostors: [
      "Extra prompt #169 (short answer)",
      "Extra prompt #169 \u2014 give a surprising answer",
      "If asked differently: extra prompt #169",
    ]
  },
  {
    name: "Prompt 170",
    real: "Extra prompt #170",
    impostors: [
      "Extra prompt #170 (short answer)",
      "Extra prompt #170 \u2014 give a surprising answer",
      "If asked differently: extra prompt #170",
    ]
  },
  {
    name: "Prompt 171",
    real: "Extra prompt #171",
    impostors: [
      "Extra prompt #171 (short answer)",
      "Extra prompt #171 \u2014 give a surprising answer",
      "If asked differently: extra prompt #171",
    ]
  },
  {
    name: "Prompt 172",
    real: "Extra prompt #172",
    impostors: [
      "Extra prompt #172 (short answer)",
      "Extra prompt #172 \u2014 give a surprising answer",
      "If asked differently: extra prompt #172",
    ]
  },
  {
    name: "Prompt 173",
    real: "Extra prompt #173",
    impostors: [
      "Extra prompt #173 (short answer)",
      "Extra prompt #173 \u2014 give a surprising answer",
      "If asked differently: extra prompt #173",
    ]
  },
  {
    name: "Prompt 174",
    real: "Extra prompt #174",
    impostors: [
      "Extra prompt #174 (short answer)",
      "Extra prompt #174 \u2014 give a surprising answer",
      "If asked differently: extra prompt #174",
    ]
  },
  {
    name: "Prompt 175",
    real: "Extra prompt #175",
    impostors: [
      "Extra prompt #175 (short answer)",
      "Extra prompt #175 \u2014 give a surprising answer",
      "If asked differently: extra prompt #175",
    ]
  },
  {
    name: "Prompt 176",
    real: "Extra prompt #176",
    impostors: [
      "Extra prompt #176 (short answer)",
      "Extra prompt #176 \u2014 give a surprising answer",
      "If asked differently: extra prompt #176",
    ]
  },
  {
    name: "Prompt 177",
    real: "Extra prompt #177",
    impostors: [
      "Extra prompt #177 (short answer)",
      "Extra prompt #177 \u2014 give a surprising answer",
      "If asked differently: extra prompt #177",
    ]
  },
  {
    name: "Prompt 178",
    real: "Extra prompt #178",
    impostors: [
      "Extra prompt #178 (short answer)",
      "Extra prompt #178 \u2014 give a surprising answer",
      "If asked differently: extra prompt #178",
    ]
  },
  {
    name: "Prompt 179",
    real: "Extra prompt #179",
    impostors: [
      "Extra prompt #179 (short answer)",
      "Extra prompt #179 \u2014 give a surprising answer",
      "If asked differently: extra prompt #179",
    ]
  },
  {
    name: "Prompt 180",
    real: "Extra prompt #180",
    impostors: [
      "Extra prompt #180 (short answer)",
      "Extra prompt #180 \u2014 give a surprising answer",
      "If asked differently: extra prompt #180",
    ]
  },
  {
    name: "Prompt 181",
    real: "Extra prompt #181",
    impostors: [
      "Extra prompt #181 (short answer)",
      "Extra prompt #181 \u2014 give a surprising answer",
      "If asked differently: extra prompt #181",
    ]
  },
  {
    name: "Prompt 182",
    real: "Extra prompt #182",
    impostors: [
      "Extra prompt #182 (short answer)",
      "Extra prompt #182 \u2014 give a surprising answer",
      "If asked differently: extra prompt #182",
    ]
  },
  {
    name: "Prompt 183",
    real: "Extra prompt #183",
    impostors: [
      "Extra prompt #183 (short answer)",
      "Extra prompt #183 \u2014 give a surprising answer",
      "If asked differently: extra prompt #183",
    ]
  },
  {
    name: "Prompt 184",
    real: "Extra prompt #184",
    impostors: [
      "Extra prompt #184 (short answer)",
      "Extra prompt #184 \u2014 give a surprising answer",
      "If asked differently: extra prompt #184",
    ]
  },
  {
    name: "Prompt 185",
    real: "Extra prompt #185",
    impostors: [
      "Extra prompt #185 (short answer)",
      "Extra prompt #185 \u2014 give a surprising answer",
      "If asked differently: extra prompt #185",
    ]
  },
  {
    name: "Prompt 186",
    real: "Extra prompt #186",
    impostors: [
      "Extra prompt #186 (short answer)",
      "Extra prompt #186 \u2014 give a surprising answer",
      "If asked differently: extra prompt #186",
    ]
  },
  {
    name: "Prompt 187",
    real: "Extra prompt #187",
    impostors: [
      "Extra prompt #187 (short answer)",
      "Extra prompt #187 \u2014 give a surprising answer",
      "If asked differently: extra prompt #187",
    ]
  },
  {
    name: "Prompt 188",
    real: "Extra prompt #188",
    impostors: [
      "Extra prompt #188 (short answer)",
      "Extra prompt #188 \u2014 give a surprising answer",
      "If asked differently: extra prompt #188",
    ]
  },
  {
    name: "Prompt 189",
    real: "Extra prompt #189",
    impostors: [
      "Extra prompt #189 (short answer)",
      "Extra prompt #189 \u2014 give a surprising answer",
      "If asked differently: extra prompt #189",
    ]
  },
  {
    name: "Prompt 190",
    real: "Extra prompt #190",
    impostors: [
      "Extra prompt #190 (short answer)",
      "Extra prompt #190 \u2014 give a surprising answer",
      "If asked differently: extra prompt #190",
    ]
  },
  {
    name: "Prompt 191",
    real: "Extra prompt #191",
    impostors: [
      "Extra prompt #191 (short answer)",
      "Extra prompt #191 \u2014 give a surprising answer",
      "If asked differently: extra prompt #191",
    ]
  },
  {
    name: "Prompt 192",
    real: "Extra prompt #192",
    impostors: [
      "Extra prompt #192 (short answer)",
      "Extra prompt #192 \u2014 give a surprising answer",
      "If asked differently: extra prompt #192",
    ]
  },
  {
    name: "Prompt 193",
    real: "Extra prompt #193",
    impostors: [
      "Extra prompt #193 (short answer)",
      "Extra prompt #193 \u2014 give a surprising answer",
      "If asked differently: extra prompt #193",
    ]
  },
  {
    name: "Prompt 194",
    real: "Extra prompt #194",
    impostors: [
      "Extra prompt #194 (short answer)",
      "Extra prompt #194 \u2014 give a surprising answer",
      "If asked differently: extra prompt #194",
    ]
  },
  {
    name: "Prompt 195",
    real: "Extra prompt #195",
    impostors: [
      "Extra prompt #195 (short answer)",
      "Extra prompt #195 \u2014 give a surprising answer",
      "If asked differently: extra prompt #195",
    ]
  },
  {
    name: "Prompt 196",
    real: "Extra prompt #196",
    impostors: [
      "Extra prompt #196 (short answer)",
      "Extra prompt #196 \u2014 give a surprising answer",
      "If asked differently: extra prompt #196",
    ]
  },
  {
    name: "Prompt 197",
    real: "Extra prompt #197",
    impostors: [
      "Extra prompt #197 (short answer)",
      "Extra prompt #197 \u2014 give a surprising answer",
      "If asked differently: extra prompt #197",
    ]
  },
  {
    name: "Prompt 198",
    real: "Extra prompt #198",
    impostors: [
      "Extra prompt #198 (short answer)",
      "Extra prompt #198 \u2014 give a surprising answer",
      "If asked differently: extra prompt #198",
    ]
  },
  {
    name: "Prompt 199",
    real: "Extra prompt #199",
    impostors: [
      "Extra prompt #199 (short answer)",
      "Extra prompt #199 \u2014 give a surprising answer",
      "If asked differently: extra prompt #199",
    ]
  },
  {
    name: "Prompt 200",
    real: "Extra prompt #200",
    impostors: [
      "Extra prompt #200 (short answer)",
      "Extra prompt #200 \u2014 give a surprising answer",
      "If asked differently: extra prompt #200",
    ]
  },
];


const similarityScore = (a="", b="") => {
  const A = new Set(a.toLowerCase().split(/\s+/).filter(Boolean));
  const B = new Set(b.toLowerCase().split(/\s+/).filter(Boolean));
  const inter = new Set([...A].filter(x=>B.has(x)));
  const union = new Set([...A,...B]);
  return union.size ? inter.size/union.size : 0;
};

const colorFromString = (s="")=>{
  let hash=0;
  for (let i=0;i<s.length;i++) hash = s.charCodeAt(i) + ((hash<<5)-hash);
  const hue = Math.abs(hash)%360;
  return `hsl(${hue} 70% 50%)`;
};

function Avatar({name,size=40}) {
  const initials = (name||"Anon").split(/[_\s]+/).map(p=>p[0]||"").slice(0,2).join("").toUpperCase();
  const bg = colorFromString(name||"anon");
  return <div style={{width:size,height:size,borderRadius:"50%",background:bg,display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:700}}>{initials}</div>;
}

export default function App(){
  const [name,setName]=useState("");
  const [roomCode,setRoomCode]=useState("");
  const [players,setPlayers]=useState({});
  const [impostors,setImpostors]=useState([]);
  const [phase,setPhase]=useState("lobby");
  const [timerEnd,setTimerEnd]=useState(null);
  const [creator,setCreator]=useState("");
  const [timeLeft,setTimeLeft]=useState(0);
  const [realQuestion,setRealQuestion]=useState("");
  const [round,setRound]=useState(1);
  const [selectedVotes,setSelectedVotes]=useState([]);
  const [confetti,setConfetti]=useState(null);

  useEffect(()=>{ import("canvas-confetti").then(m=>setConfetti(()=>m.default)).catch(()=>{}); },[]);

  useEffect(()=>{
    if(!roomCode) return;
    const r = ref(database, `rooms/${sanitize(roomCode)}`);
    return onValue(r, async snap=>{
      const d = snap.val();
      if(!d) return;
      setPlayers(d.players||{});
      setImpostors(d.impostors||[]);
      setPhase(d.phase||"lobby");
      setTimerEnd(d.timerEnd||null);
      setCreator(d.creator||"");
      setRealQuestion(d.realQuestion||"");
      setRound(d.round||1);

      const keys = Object.keys(d.players||{});
      if(d.phase==="answer"){
        const all = keys.every(k=> (d.players[k]?.answer||"").trim().length>0 );
        if(all) await update(r,{phase:"debate", timerEnd: Date.now()+3*60*1000});
      }
      if(d.phase==="debate"){
        const all = keys.every(k=> (d.players[k]?.vote||[]).length>0 );
        if(all) await update(r,{phase:"reveal", timerEnd: null});
      }
    });
  },[roomCode]);

  useEffect(()=>{
    if(!timerEnd) return;
    const t=setInterval(()=> setTimeLeft(Math.max(0, Math.ceil((timerEnd-Date.now())/1000))),1000);
    return ()=>clearInterval(t);
  },[timerEnd]);

  const createRoom = async ()=>{
    if(!isValidPath(name)) return alert("Invalid name");
    const code = String(Math.floor(Math.random()*9000+1000));
    const sc=sanitize(code), sn=sanitize(name);
    setRoomCode(sc); setCreator(sn);
    await set(ref(database, `rooms/${sc}`), {
      players: { [sn]: {answer:"", vote:[]} },
      impostors: [],
      phase: "lobby",
      timerEnd: null,
      creator: sn,
      realQuestion: "",
      round: 1
    });
  };

  const joinRoom = async ()=>{
    if(!isValidPath(name)||!isValidPath(roomCode)) return alert("Invalid name or room");
    const sc=sanitize(roomCode), sn=sanitize(name);
    const snap = await get(ref(database, `rooms/${sc}`));
    if(!snap.exists()) return alert("Room not found");
    await set(ref(database, `rooms/${sc}/players/${sn}`), {answer:"", vote:[]});
  };

  const startRound = async ()=>{
    const sc=sanitize(roomCode), r=ref(database, `rooms/${sc}`);
    const snap=await get(r); if(!snap.exists()) return;
    const d=snap.val(); const keys=Object.keys(d.players||{});
    if(!keys.length) return;
    const num = Math.max(1, Math.floor(keys.length/3));
    const sh = [...keys].sort(()=>0.5-Math.random()); const pick = sh.slice(0,num);
    const cat = promptCategories[Math.floor(Math.random()*promptCategories.length)];
    const updated={};
    keys.forEach(k=> updated[k] = { answer:"", vote:[], variant: pick.includes(k) ? cat.impostors[Math.floor(Math.random()*cat.impostors.length)] : cat.real });
    await update(r, { players: updated, impostors: pick, realQuestion: cat.real, phase:"answer", timerEnd: Date.now()+60*1000 });
  };

  const submitVote = async ()=>{
    const sc=sanitize(roomCode), sn=sanitize(name);
    await set(ref(database, `rooms/${sc}/players/${sn}/vote`), selectedVotes);
    setSelectedVotes([]);
  };

  const mostSimilarPairs = ()=>{
    const keys=Object.keys(players); const out=[];
    for(let i=0;i<keys.length;i++) for(let j=i+1;j<keys.length;j++){
      out.push({pair:[keys[i],keys[j]], score: similarityScore(players[keys[i]]?.answer||"", players[keys[j]]?.answer||"")});
    }
    return out.sort((a,b)=>b.score-a.score).slice(0,3);
  };

  useEffect(()=>{
    if(phase!=="reveal"||!confetti) return;
    Object.entries(players).forEach(([p,d])=>{
      if((d.vote||[]).some(v=> impostors.includes(v))) try{ confetti({particleCount:60, spread:70, origin:{y:0.6}}); }catch(e){}
    });
  },[phase,players,impostors,confetti]);

  return (
    <div style={{fontFamily:"Segoe UI,Arial", padding:20, maxWidth:1100, margin:"0 auto", background:"linear-gradient(#081524,#0d1f33)", color:"#eaffff", minHeight:"100vh"}}>
      <h1 style={{textAlign:"center"}}>🎮 Guess The Liar — Arcade Mode</h1>
      <div style={{opacity:0.6, textAlign:"center"}}>Room: {roomCode||"—"} | You: {name||"anon"}</div>

      {phase==="lobby" && (
        <div style={{marginTop:20, padding:20, borderRadius:12, background:"rgba(255,255,255,0.03)"}}>
          <h2>Lobby</h2>
          <input placeholder="Your name" value={name} onChange={e=>setName(e.target.value)} style={{display:"block",width:"100%",padding:10,marginBottom:10}}/>
          <input placeholder="Room code" value={roomCode} onChange={e=>setRoomCode(e.target.value)} style={{display:"block",width:"100%",padding:10,marginBottom:10}}/>
          <button onClick={createRoom} style={{marginRight:8}}>Create</button>
          <button onClick={joinRoom} style={{marginRight:8}}>Join</button>
          {sanitize(name)===creator && <button onClick={startRound}>Start Game</button>}

          <h3 style={{marginTop:20}}>Players</h3>
          {Object.keys(players).map(p=>(
            <div key={p} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><Avatar name={p} size={36}/> <div>{p}{p===creator?" (host)":""}</div></div>
          ))}
        </div>
      )}

      {phase==="answer" && (
        <div style={{marginTop:20, padding:20, borderRadius:12, background:"rgba(255,255,255,0.03)"}}>
          <h2>Answer Phase — Round {round}</h2>
          <div><strong>Your prompt:</strong> {players[sanitize(name)]?.variant||""}</div>
          <input value={players[sanitize(name)]?.answer||""} onChange={e=>update(ref(database, `rooms/${sanitize(roomCode)}/players/${sanitize(name)}`), {answer:e.target.value})} style={{width:"100%",padding:10,marginTop:10}}/>
          <div style={{marginTop:10}}>⏳ Time left: {timeLeft}s</div>

          <h3 style={{marginTop:16}}>Status</h3>
          {Object.entries(players).map(([p,d])=>(
            <div key={p} style={{display:"flex",alignItems:"center",gap:8,marginBottom:6}}><Avatar name={p} size={28}/> <div>{p} — {d.answer?"✔ answered":"… waiting"}</div></div>
          ))}
        </div>
      )}

      {phase==="debate" && (
        <div style={{marginTop:20, padding:20, borderRadius:12, background:"rgba(255,255,255,0.03)"}}>
          <h2>Debate</h2>
          <div><strong>Real question:</strong> {realQuestion}</div>
          <div style={{display:"flex",flexWrap:"wrap",gap:8,marginTop:10}}>
            {Object.keys(players).map(p=>(
              <button key={p} onClick={()=>setSelectedVotes(prev=> prev.includes(p)? prev.filter(x=>x!==p): [...prev,p])} style={{padding:"8px 12px",borderRadius:8}}><Avatar name={p} size={26}/> {p} {selectedVotes.includes(p)?"✓":""}</button>
            ))}
          </div>
          <button onClick={submitVote} style={{marginTop:12}}>Submit Vote</button>
          <div style={{marginTop:8}}>⏳ Time left: {timeLeft}s</div>
        </div>
      )}

      {phase==="reveal" && (
        <div style={{marginTop:20, padding:20, borderRadius:12, background:"rgba(255,255,255,0.03)"}}>
          <h2>Reveal Phase</h2>
          <div><strong>Impostors:</strong> {impostors.join(", ")}</div>
          <h3 style={{marginTop:10}}>Votes</h3>
          {Object.entries(players).map(([p,d])=> <p key={p}><strong>{p}</strong> voted for: {(d.vote||[]).join(", ")||"Nobody"}</p>)}
          <h3 style={{marginTop:10}}>Most similar answers</h3>
          {mostSimilarPairs().map((s,i)=>(<p key={i}>{s.pair.join(" & ")} — {Math.round(s.score*100)}%</p>))}
          {sanitize(name)===creator && <button onClick={()=>update(ref(database, `rooms/${sanitize(roomCode)}`),{round:round+1, phase:"lobby"})} style={{marginTop:12}}>Next Round</button>}
        </div>
      )}

    </div>
  );
}
