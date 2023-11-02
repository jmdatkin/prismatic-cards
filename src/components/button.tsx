
export default (props: any) => {

    const { children, ...restProps } = props;

    return <button className="bg-orange-400 rounded p-2 hover:bg-orange-300 active:bg-orange-500 active:ring ring-color-orange" {...restProps}>{props.children}</button>
}