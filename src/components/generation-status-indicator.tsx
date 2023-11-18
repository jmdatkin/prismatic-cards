import { AppRouter } from "@/server/api/root";
import { api } from "@/utils/api";
import { useQuery } from "@tanstack/react-query";
import { inferProcedureOutput } from "@trpc/server";
import LoadingSpinner from "./loading-spinner";

const useGetPendingCard = (id: number) => {
    return api.pendingCard.get.useQuery(id);
}

export default function GenerateStatusIndicator(props: { pendingCardId?: number }) {

    let data;
    const response = props.pendingCardId ? useGetPendingCard(props.pendingCardId) : null;
    if (response) {
        data = response.data;
        console.log(data);
    } else {
        data = null;
    }

    if (data && !data.fulfilled) {
        return <span>Generating...<LoadingSpinner></LoadingSpinner></span>
    } else {
        return <></>
    }
}