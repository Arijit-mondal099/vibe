interface Props {
  params: Promise<{ projectId: string }>;
}

const Page: React.FC<Props> = async ({ params }) => {
  const { projectId } = await params;

  return (
    <section>
      <p>Project: {projectId}</p>
    </section>
  );
};

export default Page;
