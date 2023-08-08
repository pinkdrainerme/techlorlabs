"use strict";
var UserStatus;
(function (UserStatus) {
    UserStatus["LoggedIn"] = "Logged In";
    UserStatus["LoggingIn"] = "Logging In";
    UserStatus["LoggedOut"] = "Logged Out";
    UserStatus["LogInError"] = "Log In Error";
    UserStatus["VerifyingLogIn"] = "Verifying Log In";
})(UserStatus || (UserStatus = {}));
var Default;
(function (Default) {
    Default["PIN"] = "1234";
})(Default || (Default = {}));
var WeatherType;
(function (WeatherType) {
    WeatherType["Cloudy"] = "Cloudy";
    WeatherType["Rainy"] = "Rainy";
    WeatherType["Stormy"] = "Stormy";
    WeatherType["Sunny"] = "Sunny";
})(WeatherType || (WeatherType = {}));
const defaultPosition = () => ({
    left: 0,
    x: 0
});
const N = {
    clamp: (min, value, max) => Math.min(Math.max(min, value), max),
    rand: (min, max) => Math.floor(Math.random() * (max - min + 1) + min)
};
const T = {
    format: (date) => {
        const hours = T.formatHours(date.getHours()), minutes = date.getMinutes(), seconds = date.getSeconds();
        return `${hours}:${T.formatSegment(minutes)}`;
    },
    formatHours: (hours) => {
        return hours % 12 === 0 ? 12 : hours % 12;
    },
    formatSegment: (segment) => {
        return segment < 10 ? `0${segment}` : segment;
    }
};
const LogInUtility = {
    verify: async (pin) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (pin === Default.PIN) {
                    resolve(true);
                }
                else {
                    reject(`Invalid pin: ${pin}`);
                }
            }, N.rand(300, 700));
        });
    }
};
const useCurrentDateEffect = () => {
    const [date, setDate] = React.useState(new Date());
    React.useEffect(() => {
        const interval = setInterval(() => {
            const update = new Date();
            if (update.getSeconds() !== date.getSeconds()) {
                setDate(update);
            }
        }, 100);
        return () => clearInterval(interval);
    }, [date]);
    return date;
};
const ScrollableComponent = (props) => {
    const ref = React.useRef(null);
    const [state, setStateTo] = React.useState({
        grabbing: false,
        position: defaultPosition()
    });
    const handleOnMouseDown = (e) => {
        setStateTo(Object.assign(Object.assign({}, state), { grabbing: true, position: {
                x: e.clientX,
                left: ref.current.scrollLeft
            } }));
    };
    const handleOnMouseMove = (e) => {
        if (state.grabbing) {
            const left = Math.max(0, state.position.left + (state.position.x - e.clientX));
            ref.current.scrollLeft = left;
        }
    };
    const handleOnMouseUp = () => {
        if (state.grabbing) {
            setStateTo(Object.assign(Object.assign({}, state), { grabbing: false }));
        }
    };
    return (React.createElement("div", { ref: ref, className: classNames("scrollable-component", props.className), id: props.id, onMouseDown: handleOnMouseDown, onMouseMove: handleOnMouseMove, onMouseUp: handleOnMouseUp, onMouseLeave: handleOnMouseUp }, props.children));
};
const WeatherSnap = () => {
    const [temperature] = React.useState(N.rand(65, 85));
    return (React.createElement("span", { className: "weather" },
        React.createElement("i", { className: "weather-type", className: "fa-duotone fa-sun" }),
        React.createElement("span", { className: "weather-temperature-value" }, temperature),
        React.createElement("span", { className: "weather-temperature-unit" }, "\u00B0F")));
};
const Reminder = () => {
    return (React.createElement("div", { className: "reminder" },
        React.createElement("div", { className: "reminder-icon" },
            React.createElement("i", { className: "fa-regular fa-bell" })),
        React.createElement("span", { className: "reminder-text" },
            "Welcome to Techlor Labs ",
            React.createElement("span", { className: "reminder-time" }, "   - hello@techlorlabs.com"))));
};
const Time = () => {
    const date = useCurrentDateEffect();
    return (React.createElement("span", { className: "time" }, T.format(date)));
};
const Info = (props) => {
    return (React.createElement("div", { id: props.id, className: "info" },
        React.createElement(Time, null),
        React.createElement(WeatherSnap, null)));
};
const PinDigit = (props) => {
    const [hidden, setHiddenTo] = React.useState(false);
    React.useEffect(() => {
        if (props.value) {
            const timeout = setTimeout(() => {
                setHiddenTo(true);
            }, 500);
            return () => {
                setHiddenTo(false);
                clearTimeout(timeout);
            };
        }
    }, [props.value]);
    return (React.createElement("div", { className: classNames("app-pin-digit", { focused: props.focused, hidden }) },
        React.createElement("span", { className: "app-pin-digit-value" }, props.value || "")));
};
const Pin = () => {
    const { userStatus, setUserStatusTo } = React.useContext(AppContext);
    const [pin, setPinTo] = React.useState("");
    const ref = React.useRef(null);
    React.useEffect(() => {
        if (userStatus === UserStatus.LoggingIn || userStatus === UserStatus.LogInError) {
            ref.current.focus();
        }
        else {
            setPinTo("");
        }
    }, [userStatus]);
    React.useEffect(() => {
        if (pin.length === 4) {
            const verify = async () => {
                try {
                    setUserStatusTo(UserStatus.VerifyingLogIn);
                    if (await LogInUtility.verify(pin)) {
                        setUserStatusTo(UserStatus.LoggedIn);
                    }
                }
                catch (err) {
                    console.error(err);
                    setUserStatusTo(UserStatus.LogInError);
                }
            };
            verify();
        }
        if (userStatus === UserStatus.LogInError) {
            setUserStatusTo(UserStatus.LoggingIn);
        }
    }, [pin]);
    const handleOnClick = () => {
        ref.current.focus();
    };
    const handleOnCancel = () => {
        setUserStatusTo(UserStatus.LoggedOut);
    };
    const handleOnChange = (e) => {
        if (e.target.value.length <= 4) {
            setPinTo(e.target.value.toString());
        }
    };
    const getCancelText = () => {
        return (React.createElement("span", { id: "app-pin-cancel-text", onClick: handleOnCancel }, "Cancel"));
    };
    const getErrorText = () => {
        if (userStatus === UserStatus.LogInError) {
            return (React.createElement("span", { id: "app-pin-error-text" }, "Invalid"));
        }
    };
    return (React.createElement("div", { id: "app-pin-wrapper" },
        React.createElement("input", { disabled: userStatus !== UserStatus.LoggingIn && userStatus !== UserStatus.LogInError, id: "app-pin-hidden-input", maxLength: 4, ref: ref, type: "number", value: pin, onChange: handleOnChange }),
        React.createElement("div", { id: "app-pin", onClick: handleOnClick },
            React.createElement(PinDigit, { focused: pin.length === 0, value: pin[0] }),
            React.createElement(PinDigit, { focused: pin.length === 1, value: pin[1] }),
            React.createElement(PinDigit, { focused: pin.length === 2, value: pin[2] }),
            React.createElement(PinDigit, { focused: pin.length === 3, value: pin[3] })),
        React.createElement("h3", { id: "app-pin-label" },
            "Enter PIN (1234) ",
            getErrorText(),
            " ",
            getCancelText())));
};
const MenuSection = (props) => {
    const getContent = () => {
        if (props.scrollable) {
            return (React.createElement(ScrollableComponent, { className: "menu-section-content" }, props.children));
        }
        return (React.createElement("div", { className: "menu-section-content" }, props.children));
    };
    return (React.createElement("div", { id: props.id, className: "menu-section" },
        React.createElement("div", { className: "menu-section-title" },
            React.createElement("i", { className: props.icon }),
            React.createElement("span", { className: "menu-section-title-text" }, props.title)),
        getContent()));
};
const QuickNav = () => {
    const getItems = () => {
        return [{
                id: 1,
                label: "Web3"
            }, {
                id: 2,
                label: "AR"
            }, {
                id: 3,
                label: "Apps"
            }, {
                id: 4,
                label: "Development"
            }].map((item) => {
            return (React.createElement("div", { key: item.id, className: "quick-nav-item clear-button" },
                React.createElement("span", { className: "quick-nav-item-label" }, item.label)));
        });
    };
    return (React.createElement(ScrollableComponent, { id: "quick-nav" }, getItems()));
};
const Weather = () => {
    const getDays = () => {
        return [{
      id: 1,
      name: "Mon",
      temperature: N.rand(60, 80),
      weather: WeatherType.Sunny
    }, {
      id: 2,
      name: "Tues",
      temperature: N.rand(60, 80),
      weather: WeatherType.Sunny
    }, {
      id: 3,
      name: "Wed",
      temperature: N.rand(60, 80),
      weather: WeatherType.Cloudy
    }, {
      id: 4,
      name: "Thurs",
      temperature: N.rand(60, 80),
      weather: WeatherType.Rainy
    }, {
      id: 5,
      name: "Fri",
      temperature: N.rand(60, 80),
      weather: WeatherType.Stormy
    }, {
      id: 6,
      name: "Sat",
      temperature: N.rand(60, 80),
      weather: WeatherType.Sunny
    }, {
      id: 7,
      name: "Sun",
      temperature: N.rand(60, 80),
      weather: WeatherType.Cloudy
    }].map((day) => {
            const getIcon = () => {
                switch (day.weather) {
                    case WeatherType.Cloudy:
                        return "fa-duotone fa-clouds";
                    case WeatherType.Rainy:
                        return "fa-duotone fa-cloud-drizzle";
                    case WeatherType.Stormy:
                        return "fa-duotone fa-cloud-bolt";
                    case WeatherType.Sunny:
                        return "fa-duotone fa-sun";
                }
            };
            return (React.createElement("div", { key: day.id, className: "day-card" },
                React.createElement("div", { className: "day-card-content" },
                    React.createElement("span", { className: "day-weather-temperature" },
                        day.temperature,
                        React.createElement("span", { className: "day-weather-temperature-unit" }, "\u00B0F")),
                    React.createElement("i", { className: classNames("day-weather-icon", getIcon(), day.weather.toLowerCase()) }),
                    React.createElement("span", { className: "day-name" }, day.name))));
        });
    };
    return (React.createElement(MenuSection, { icon: "fa-solid fa-sun", id: "weather-section", scrollable: true, title: "How's it look out there?" }, getDays()));
};
const Tools = () => {
    const getTools = () => {
        return [{
                icon: "fa-solid fa-cloud-sun",
                id: 1,
                image: "https://i.ibb.co/q9GM7th/P1.jpg",
                label: "rainforest.arkivert.no/",
                name: "Regnskogfondet"
            }, {
                icon: "fa-solid fa-calculator-simple",
                id: 2,
                image: "https://i.ibb.co/347B6m8/P2.jpg",
                label: "Meridianacademics.com",
                name: "Meridian"
            }, {
                icon: "fa-solid fa-piggy-bank",
                id: 3,
                image: "https://i.ibb.co/2KnKNgs/P3.jpg",
                label: "swagloons.com",
                name: "Swagloons"
            }, {
                icon: "fa-solid fa-plane",
                id: 4,
                image: "https://i.ibb.co/Wt2xS3v/P4.jpg",
                label: "api.naughty360.com",
                name: "Naughty360"
            }, {
                icon: "fa-solid fa-gamepad-modern",
                id: 5,
                image: "https://pbs.twimg.com/profile_images/1672919944814800896/hmPBjd3c_400x400.jpg",
                label: "univerxe.io,univerxe.org",
                name: "Univerxe Game"
            }, {
                icon: "fa-solid fa-video",
                id: 6,
                image: "https://play-lh.googleusercontent.com/N3jP0C_U7m72s57MLsyepf77aBYbdqQOmjYgSFU-0qOUox_ZYNbL6bmY_oNM8wPi4YTW=w240-h480-rw",
                label: "iOS/Android App",
                name: "Hiha - Video Chat"
            }].map((tool) => {
            const styles = {
                backgroundImage: `url(${tool.image})`
            };
            return (React.createElement("div", { key: tool.id, className: "tool-card" },
                React.createElement("div", { className: "tool-card-background background-image", style: styles }),
                React.createElement("div", { className: "tool-card-content" },
                    React.createElement("div", { className: "tool-card-content-header" },
                        React.createElement("span", { className: "tool-card-label" }, tool.label),
                        React.createElement("span", { className: "tool-card-name" }, tool.name)),
                    React.createElement("i", { className: classNames(tool.icon, "tool-card-icon") }))));
        });
    };
    return (React.createElement(MenuSection, { icon: "fa-solid fa-toolbox", id: "tools-section", title: "Client Partners" }, getTools()));
};
const Restaurants = () => {
    const getRestaurants = () => {
        return [{
                desc: "DApps,NFT & Token Deployment",
                id: 1,
                image: "https://www.gettingsmart.com/wp-content/uploads/2022/08/c0e334cb-b270-4be4-a8a2-59f14426370b_Group20562-1024x456.png",
                title: "Web3 Development"
            }, {
                desc: "iOS & Android",
                id: 2,
                image: "https://c1.wallpaperflare.com/preview/854/375/645/caucasian-sea-summer-water.jpg",
                title: "App Development"
            }, {
                desc: "UI/UX,3D & Graphic Designing",
                id: 3,
                image: "https://media.istockphoto.com/id/1191609321/photo/graphic-designer-drawing-sketches-logo-design.jpg?s=612x612&w=0&k=20&c=UOJSXYUWaPwMa3urhbzmY7yuDiQUeKYIAMb08bNk2Sk=",
                title: "Design"
            }, {
                desc: "Website & Website Design",
                id: 4,
                image: "https://images.unsplash.com/photo-1534665482403-a909d0d97c67?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1yZWxhdGVkfDE0fHx8ZW58MHx8fHx8&w=1000&q=80",
                title: "Web Development"
            }, {
                desc: "AR Apps, Social Filters & Games",
                id: 5,
                image: "https://c4.wallpaperflare.com/wallpaper/864/508/855/review-hi-tech-news-of-2015-windows-10-augmented-reality-wallpaper-preview.jpg",
                title: "AR Development"
            }].map((restaurant) => {
            const styles = {
                backgroundImage: `url(${restaurant.image})`
            };
            return (React.createElement("div", { key: restaurant.id, className: "restaurant-card background-image", style: styles },
                React.createElement("div", { className: "restaurant-card-content" },
                    React.createElement("div", { className: "restaurant-card-content-items" },
                        React.createElement("span", { className: "restaurant-card-title" }, restaurant.title),
                        React.createElement("span", { className: "restaurant-card-desc" }, restaurant.desc)))));
        });
    };
    return (React.createElement(MenuSection, { icon: "fa-regular fa-pot-food", id: "restaurants-section", title: "Get it delivered!" }, getRestaurants()));
};
const Movies = () => {
    const getMovies = () => {
        return [{
                desc: "We can deliver a Prebuilded Web3 NFT Marketplace on Ethereum/Solana/Base/Aptos/Matic for 30000$ including Support",
                id: 1,
                icon: "fa-solid fa-galaxy",
                image: "https://www.mindinventory.com/blog/wp-content/uploads/2023/05/nft-app.webp",
                title: "Prebuilded NFT Marketplace"
            }, {
                desc: "Build OTT Apps in Android, iOS, Website with techlor Labs.Techlor designs and develops video and audio streaming apps with an in-app payment gateway. If you are a content creator looking to monetize the content with your own platform, please reach out to us.",
                id: 2,
                icon: "fa-solid fa-hat-wizard",
                image: "https://ideausher.com/wp-content/uploads/2022/10/ezgif.com-gif-maker-2.webp",
                title: "OTT Platform for Movies/Series"
            }, {
                desc: "AR Restaurant Food menu is an interactive and informative mobile application. Nowadays people become more health conscious they wanted to know what they are eating and how it cooked. The application will help user to get the food items information like cooking video, ingredients, calories, pros and cons of particular food etc",
                id: 3,
                icon: "fa-solid fa-broom-ball",
                image: "https://www.zumoko.com/app/uploads/2018/05/01_Restaurant.jpg",
                title: "AR Menu for Restuarants"
            }, {
                desc: "The goal of using a CRM system is to improve relationships with clients and prospects, which leads to increased sales and revenue. In theory, this should happen because the CRM system helps sales reps work more efficiently and effectively by giving them quick access to customer data and providing guidance on the best way to interact with each customer. However, many companies find that their CRM systems don’t live up to expectations but Techlor Can.",
                id: 4,
                icon: "fa-solid fa-starship-freighter",
                image: "https://media.licdn.com/dms/image/C5612AQFRNuNn65ZCBA/article-cover_image-shrink_720_1280/0/1605711553234?e=2147483647&v=beta&t=FDBTPWM7t3DpzTO_qDyg0mAw4g7fkA3vU1wSvS93cdQ",
                title: "CRM for Business Management"
            }].map((movie) => {
            const styles = {
                backgroundImage: `url(${movie.image})`
            };
            const id = `movie-card-${movie.id}`;
            return (React.createElement("div", { key: movie.id, id: id, className: "movie-card" },
                React.createElement("div", { className: "movie-card-background background-image", style: styles }),
                React.createElement("div", { className: "movie-card-content" },
                    React.createElement("div", { className: "movie-card-info" },
                        React.createElement("span", { className: "movie-card-title" }, movie.title),
                        React.createElement("span", { className: "movie-card-desc" }, movie.desc)),
                    React.createElement("i", { className: movie.icon }))));
        });
    };
    return (React.createElement(MenuSection, { icon: "fa-solid fa-camera-movie", id: "movies-section", scrollable: true, title: "Prebuilded by Techlor" }, getMovies()));
};
const UserStatusButton = (props) => {
    const { userStatus, setUserStatusTo } = React.useContext(AppContext);
    const handleOnClick = () => {
        setUserStatusTo(props.userStatus);
    };
    return (React.createElement("button", { id: props.id, className: "user-status-button clear-button", disabled: userStatus === props.userStatus, type: "button", onClick: handleOnClick },
        React.createElement("i", { className: props.icon })));
};
const Menu = () => {
    return (React.createElement("div", { id: "app-menu" },
        React.createElement("div", { id: "app-menu-content-wrapper" },
            React.createElement("div", { id: "app-menu-content" },
                React.createElement("div", { id: "app-menu-content-header" },
                    React.createElement("div", { className: "app-menu-content-header-section" },
                        React.createElement(Info, { id: "app-menu-info" }),
                        React.createElement(Reminder, null)),
                    React.createElement("div", { className: "app-menu-content-header-section" },
                        React.createElement(UserStatusButton, { icon: "fa-solid fa-arrow-right-from-arc", id: "sign-out-button", userStatus: UserStatus.LoggedOut }))),
                React.createElement(QuickNav, null),
                React.createElement("a", { id: "youtube-link", className: "clear-button", href: "Tel: +918590086955", target: "_blank" },
                    React.createElement("i", { className: "fa-brands fa-youtube" }),
                    React.createElement("span", null, "Contact Us")),
                React.createElement(Weather, null),
                React.createElement(Restaurants, null),
                React.createElement(Tools, null),
                React.createElement(Movies, null)))));
};
const Background = () => {
    const { userStatus, setUserStatusTo } = React.useContext(AppContext);
    const handleOnClick = () => {
        if (userStatus === UserStatus.LoggedOut) {
            setUserStatusTo(UserStatus.LoggingIn);
        }
    };
    return (React.createElement("div", { id: "app-background", onClick: handleOnClick },
        React.createElement("div", { id: "app-background-image", className: "background-image" })));
};
const Loading = () => {
    return (React.createElement("div", { id: "app-loading-icon" },
        React.createElement("i", { className: "fa-solid fa-spinner-third" })));
};
const AppContext = React.createContext(null);
const App = () => {
    const [userStatus, setUserStatusTo] = React.useState(UserStatus.LoggedOut);
    const getStatusClass = () => {
        return userStatus.replace(/\s+/g, "-").toLowerCase();
    };
    return (React.createElement(AppContext.Provider, { value: { userStatus, setUserStatusTo } },
        React.createElement("div", { id: "app", className: getStatusClass() },
            React.createElement(Info, { id: "app-info" }),
            React.createElement(Pin, null),
            React.createElement(Menu, null),
            React.createElement(Background, null),
            React.createElement("div", { id: "sign-in-button-wrapper" },
                React.createElement(UserStatusButton, { icon: "fa-solid fa-arrow-right-to-arc", id: "sign-in-button", userStatus: UserStatus.LoggingIn })),
            React.createElement(Loading, null))));
};
ReactDOM.render(React.createElement(App, null), document.getElementById("root"));