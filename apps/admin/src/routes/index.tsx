import {createFileRoute, redirect} from '@tanstack/react-router';

/** Своей главной у админки нет — сразу список администраторов. */
export const Route = createFileRoute('/')({
  beforeLoad: () => {
    throw redirect({to: '/admins'});
  },
});
