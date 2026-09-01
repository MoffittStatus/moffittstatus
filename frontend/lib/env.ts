
class Env {
    static BACKEND_URL:string = process.env.NEXT_PUBLIC_BACKEND_URL as string
    static CHATBOT_URL:string = process.env.NEXT_PUBLIC_CHATBOT_URL as string
    static APP_URL:string = process.env.NEXT_PUBLIC_APP_URL as string
}

export default Env