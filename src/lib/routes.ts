export const routes = {
    login: "/",
    verify: "/verify",
    profile: "/profile",
    trips: "/trips",
    tripDetails: (id: number) => `/trips/${id}`
};
